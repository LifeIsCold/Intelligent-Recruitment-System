<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use App\Models\Cv;
use App\Models\CvScore;
use App\Models\Job;
use App\Models\Application;
use App\Models\ScoringWeight;

class CvScoringController extends Controller
{
    protected $scoringServiceUrl;

    public function __construct()
    {
        $this->scoringServiceUrl = env('CV_SCORING_SERVICE_URL', 'http://127.0.0.1:8001');
    }

    /**
     * Score a CV against job requirements
     */
    public function scoreCV(Request $request, $cvId)
    {
        Log::info('=== CV SCORING STARTED ===', [
            'cv_id' => $cvId,
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'job_id' => 'required|exists:jobs,id',
            'application_id' => 'nullable|exists:applications,id',
            'weights' => 'nullable|array',
            'weights.required' => 'nullable|integer|min:0|max:100',
            'weights.preferred' => 'nullable|integer|min:0|max:100',
            'weights.experience' => 'nullable|integer|min:0|max:100',
            'weights.education' => 'nullable|integer|min:0|max:100',
            'weights.threshold' => 'nullable|numeric|min:0|max:1'
        ]);

        if ($validator->fails()) {
            Log::warning('CV Scoring validation failed', [
                'errors' => $validator->errors()->toArray()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $cv = Cv::where('user_id', auth()->id())->findOrFail($cvId);
            $job = Job::with('company', 'industry')->findOrFail($request->job_id);
            
            // Get scoring weights
            $weights = $this->getScoringWeights($job, $request->input('weights', []));
            
            Log::info('CV and Job found with weights', [
                'cv_id' => $cv->id,
                'cv_title' => $cv->title,
                'job_id' => $job->id,
                'job_title' => $job->title,
                'weights_used' => $weights
            ]);

            // Prepare job requirements from job data
            $requirements = [
                'job_title' => $job->title,
                'required_skills' => $job->required_skills ?? [],
                'preferred_skills' => $job->preferred_skills ?? [],
                'min_experience' => $job->min_experience ?? 0,
                'education_level' => $job->education_level ?? "Bachelor's",
                'industry' => $job->industry?->name ?? '',
                'location' => $job->location ?? ''
            ];

            // Determine if we should use Python service
            $usePythonService = $this->shouldUsePythonService($cv);
            $usedFallback = false;
            $scoreResult = null;
            
            if ($usePythonService) {
                try {
                    $scoreResult = $this->callScoringService($cv, $requirements, $weights);
                    Log::info('Python service call successful', [
                        'score' => $scoreResult['total_score'] ?? null,
                        'weights_used' => $weights
                    ]);
                } catch (\Exception $e) {
                    Log::warning('Python service failed, using fallback', [
                        'error' => $e->getMessage()
                    ]);
                    $scoreResult = $this->calculateFallbackScore($cv, $requirements, $weights);
                    $usedFallback = true;
                }
            } else {
                Log::info('Using fallback calculation');
                $scoreResult = $this->calculateFallbackScore($cv, $requirements, $weights);
                $usedFallback = true;
            }

            // Save score to database
            $cvScore = CvScore::create([
                'cv_id' => $cv->id,
                'job_id' => $job->id,
                'application_id' => $request->application_id,
                'total_score' => $scoreResult['total_score'],
                'score_breakdown' => array_merge($scoreResult['breakdown'] ?? [], ['weights_used' => $weights]),
                'matched_skills' => $scoreResult['matched_required_skills'] ?? [],
                'missing_skills' => $scoreResult['missing_required_skills'] ?? [],
                'bge_analysis' => $scoreResult['skill_analysis'] ?? null,
                'raw_response' => $scoreResult,
                'scored_at' => now()
            ]);

            Log::info('CV Score saved to database', [
                'score_id' => $cvScore->id,
                'total_score' => $cvScore->total_score
            ]);

            // Update application match score if applicable
            if ($request->application_id) {
                Application::where('id', $request->application_id)
                    ->update(['match_score' => $scoreResult['total_score']]);
                    
                Log::info('Application match score updated', [
                    'application_id' => $request->application_id,
                    'match_score' => $scoreResult['total_score']
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => array_merge($scoreResult, [
                    'score_id' => $cvScore->id,
                    'fallback' => $usedFallback,
                    'weights_used' => $weights,
                    'cv' => [
                        'id' => $cv->id,
                        'title' => $cv->title,
                        'file_type' => $cv->file_type
                    ],
                    'job' => [
                        'id' => $job->id,
                        'title' => $job->title,
                        'company_name' => $job->company->name ?? 'Unknown Company'
                    ]
                ])
            ]);

        } catch (\Exception $e) {
            Log::error('CV Scoring critical error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error scoring CV: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get scoring weights with priority: request > job > company > global
     */
    private function getScoringWeights($job, $requestWeights = [])
    {
        // Default weights
        $defaultWeights = [
            'required' => 75,
            'preferred' => 0,
            'experience' => 20,
            'education' => 5,
            'threshold' => 0.6
        ];
        
        $weights = $defaultWeights;
        
        // Try to get job-specific weights first
        if ($job->scoringWeight) {
            $weights = [
                'required' => $job->scoringWeight->required_skills_weight,
                'preferred' => $job->scoringWeight->preferred_skills_weight,
                'experience' => $job->scoringWeight->experience_weight,
                'education' => $job->scoringWeight->education_weight,
                'threshold' => $job->scoringWeight->similarity_threshold
            ];
            Log::info('Using job-specific weights', ['job_id' => $job->id, 'weights' => $weights]);
        }
        // Then try company weights
        elseif ($job->company && $job->company->scoringWeight) {
            $weights = [
                'required' => $job->company->scoringWeight->required_skills_weight,
                'preferred' => $job->company->scoringWeight->preferred_skills_weight,
                'experience' => $job->company->scoringWeight->experience_weight,
                'education' => $job->company->scoringWeight->education_weight,
                'threshold' => $job->company->scoringWeight->similarity_threshold
            ];
            Log::info('Using company-specific weights', ['company_id' => $job->company->id, 'weights' => $weights]);
        }
        // Then try global weights
        else {
            $globalWeight = ScoringWeight::where('weightable_type', 'global')
                ->where('type', 'global')
                ->where('is_active', true)
                ->first();
                
            if ($globalWeight) {
                $weights = [
                    'required' => $globalWeight->required_skills_weight,
                    'preferred' => $globalWeight->preferred_skills_weight,
                    'experience' => $globalWeight->experience_weight,
                    'education' => $globalWeight->education_weight,
                    'threshold' => $globalWeight->similarity_threshold
                ];
                Log::info('Using global weights', ['weights' => $weights]);
            }
        }
        
        // Override with request weights if provided
        if (!empty($requestWeights)) {
            foreach (['required', 'preferred', 'experience', 'education', 'threshold'] as $key) {
                if (isset($requestWeights[$key])) {
                    $weights[$key] = $requestWeights[$key];
                }
            }
            Log::info('Overriding with request weights', ['request_weights' => $requestWeights, 'final_weights' => $weights]);
        }
        
        // Validate total weight (should be 100)
        $total = $weights['required'] + $weights['preferred'] + $weights['experience'] + $weights['education'];
        if ($total !== 100) {
            Log::warning('Weights total is not 100%, adjusting', ['total' => $total, 'weights' => $weights]);
            // Normalize to 100%
            $factor = 100 / $total;
            $weights['required'] = round($weights['required'] * $factor);
            $weights['preferred'] = round($weights['preferred'] * $factor);
            $weights['experience'] = round($weights['experience'] * $factor);
            $weights['education'] = round($weights['education'] * $factor);
        }
        
        return $weights;
    }

    /**
     * Determine if we should use the Python scoring service
     */
    private function shouldUsePythonService($cv)
    {
        if (!empty($cv->structured_data) || !empty($cv->extracted_skills)) {
            try {
                $response = Http::timeout(3)->get($this->scoringServiceUrl . '/health');
                $data = $response->json();
                
                if ($response->successful() && ($data['status'] ?? '') === 'ok') {
                    Log::info('Python service available with model: ' . ($data['model_name'] ?? 'unknown'));
                    return true;
                }
            } catch (\Exception $e) {
                Log::warning('Python service not available', ['error' => $e->getMessage()]);
            }
        }
        
        return false;
    }

    /**
     * Call Python scoring service with weights
     */
    private function callScoringService($cv, $requirements, $weights)
    {
        $baseUrl = rtrim($this->scoringServiceUrl, '/');
        $endpoint = $baseUrl . '/score-cv';
        
        Log::info('Calling Python service with weights', [
            'url' => $endpoint,
            'cv_id' => $cv->id,
            'weights' => $weights
        ]);

        try {
            $extractedSkills = $cv->extracted_skills ?? [];
            if (is_string($extractedSkills)) {
                $extractedSkills = array_map('trim', explode(',', $extractedSkills));
            }

            $structured = [
                'extracted_skills' => $extractedSkills,
                'experience_years' => (int) ($cv->experience_years ?? 0),
                'education_level' => (string) ($cv->education_level ?? ''),
                'structured_data' => (object) ($cv->structured_data ?? [])
            ];

            $response = Http::timeout(60)
                ->withOptions(['verify' => false])
                ->asMultipart()
                ->post($endpoint, [
                    [
                        'name' => 'structured_data',
                        'contents' => json_encode($structured)
                    ],
                    [
                        'name' => 'requirements',
                        'contents' => json_encode($requirements)
                    ],
                    [
                        'name' => 'weights',
                        'contents' => json_encode($weights)
                    ]
                ]);

            if ($response->failed()) {
                $errorBody = $response->body();
                Log::error('Python service error response', ['body' => $errorBody]);
                throw new \Exception('Python service error: ' . substr($errorBody, 0, 200));
            }

            $result = $response->json();
            
            Log::info('Python service response received', [
                'total_score' => $result['total_score'] ?? null,
                'processing_time' => $result['metadata']['processing_time'] ?? null
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::error('Exception in callScoringService', [
                'message' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Calculate fallback score with weights
     */
    private function calculateFallbackScore($cv, $requirements, $weights)
    {
        $cvData = $this->prepareCVDataForFallback($cv);
        return $this->calculateScoreWithWeights($cvData, $requirements, $weights);
    }

    /**
     * Calculate score with custom weights
     */
    private function calculateScoreWithWeights($cvData, $requirements, $weights)
    {
        // Parse skills
        $cvSkills = [];
        if (!empty($cvData['skills'])) {
            if (is_array($cvData['skills'])) {
                $cvSkills = $cvData['skills'];
            } elseif (is_string($cvData['skills'])) {
                $cvSkills = preg_split('/[,;\n\r]+/', $cvData['skills']);
                $cvSkills = array_map('trim', $cvSkills);
            }
        }
        
        $cvSkills = array_filter($cvSkills);
        $cvSkills = array_map('strtolower', $cvSkills);
        $cvSkills = array_values($cvSkills);
        
        $requiredSkills = array_map('strtolower', $requirements['required_skills'] ?? []);
        $preferredSkills = array_map('strtolower', $requirements['preferred_skills'] ?? []);

        // Calculate matches
        $matchedRequired = array_intersect($cvSkills, $requiredSkills);
        $matchedPreferred = array_intersect($cvSkills, $preferredSkills);
        $missingRequired = array_diff($requiredSkills, $cvSkills);

        // Calculate scores using provided weights
        $requiredScore = count($requiredSkills) > 0 
            ? (count($matchedRequired) / count($requiredSkills)) * $weights['required']
            : $weights['required'];
        
        $preferredScore = count($preferredSkills) > 0 
            ? (count($matchedPreferred) / count($preferredSkills)) * $weights['preferred']
            : $weights['preferred'];

        // Experience score
        $cvExp = (int)($cvData['years_of_experience'] ?? 0);
        $reqExp = (int)($requirements['min_experience'] ?? 0);
        $expScore = $reqExp > 0 ? min(($cvExp / $reqExp) * $weights['experience'], $weights['experience']) : $weights['experience'];

        // Education score
        $eduScore = $weights['education'];
        if (!empty($cvData['highest_education_level'])) {
            $eduLevel = strtolower($cvData['highest_education_level']);
            $eduMultiplier = 1.0;
            if (strpos($eduLevel, 'phd') !== false) $eduMultiplier = 1.0;
            elseif (strpos($eduLevel, 'master') !== false) $eduMultiplier = 0.9;
            elseif (strpos($eduLevel, 'bachelor') !== false) $eduMultiplier = 0.75;
            elseif (strpos($eduLevel, 'associate') !== false) $eduMultiplier = 0.5;
            elseif (strpos($eduLevel, 'high school') !== false) $eduMultiplier = 0.25;
            else $eduMultiplier = 0.25;
            $eduScore = $weights['education'] * $eduMultiplier;
        }

        $totalScore = $requiredScore + $preferredScore + $expScore + $eduScore;

        return [
            'total_score' => round($totalScore, 2),
            'breakdown' => [
                'required_skills' => round($requiredScore, 2),
                'preferred_skills' => round($preferredScore, 2),
                'experience' => round($expScore, 2),
                'education' => round($eduScore, 2),
                'weights_used' => $weights
            ],
            'matched_required_skills' => array_values($matchedRequired),
            'missing_required_skills' => array_values($missingRequired),
            'matched_preferred_skills' => array_values($matchedPreferred),
            'skill_analysis' => [
                'required' => array_map(function($skill) {
                    return ['skill' => $skill, 'score' => 1.0];
                }, $matchedRequired),
                'missing' => array_map(function($skill) {
                    return ['skill' => $skill, 'score' => 0.0];
                }, $missingRequired),
                'preferred' => array_map(function($skill) {
                    return ['skill' => $skill, 'score' => 1.0];
                }, $matchedPreferred)
            ],
            'experience_analysis' => [
                'provided' => $cvExp,
                'required' => $reqExp,
                'ratio' => $reqExp > 0 ? min($cvExp / $reqExp, 1.0) : 1.0
            ],
            'education_analysis' => [
                'provided' => $cvData['highest_education_level'] ?? '',
                'score' => round($eduScore, 2)
            ]
        ];
    }

    /**
     * Prepare CV data for fallback calculation
     */
    private function prepareCVDataForFallback($cv)
    {
        $data = [
            'full_name' => '',
            'professional_summary' => '',
            'skills' => '',
            'years_of_experience' => $cv->experience_years ?? 0,
            'highest_education_level' => $cv->education_level ?? '',
            'languages' => '',
            'certifications' => ''
        ];

        if (!empty($cv->extracted_skills) && is_array($cv->extracted_skills)) {
            $data['skills'] = implode(', ', $cv->extracted_skills);
        }
        elseif (!empty($cv->structured_data)) {
            $structured = $cv->structured_data;
            $possibleSkillKeys = ['skills', 'Skills', 'skill', 'Skill', 'technical_skills', 'Technical Skills'];
            
            foreach ($possibleSkillKeys as $key) {
                if (isset($structured[$key]) && !empty($structured[$key])) {
                    if (is_array($structured[$key])) {
                        $data['skills'] = implode(', ', $structured[$key]);
                    } else {
                        $data['skills'] = (string)$structured[$key];
                    }
                    break;
                }
            }
        }
        elseif (!empty($cv->text_content)) {
            $data['skills'] = $this->extractSkillsFromText($cv->text_content);
        }

        return $data;
    }

    /**
     * Extract skills from text content
     */
    private function extractSkillsFromText($text)
    {
        if (empty($text)) {
            return '';
        }
        
        $commonSkills = [
            'PHP', 'JavaScript', 'Python', 'Java', 'C#', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin',
            'Laravel', 'React', 'Vue', 'Angular', 'Node.js', 'Django', 'Flask', 'Spring Boot',
            'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'Elasticsearch', 'MariaDB', 'SQLite',
            'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'GitHub Actions',
            'Git', 'Linux', 'Nginx', 'Apache', 'REST API', 'GraphQL', 'WebSocket',
            'HTML', 'CSS', 'SCSS', 'Tailwind', 'Bootstrap', 'jQuery',
            'TypeScript', 'Express.js', 'Next.js', 'Nuxt.js', 'Gatsby'
        ];
        
        $foundSkills = [];
        $textLower = strtolower($text);
        
        foreach ($commonSkills as $skill) {
            $skillLower = strtolower($skill);
            if (strpos($textLower, $skillLower) !== false) {
                $foundSkills[] = $skill;
            }
        }
        
        return implode(', ', $foundSkills);
    }

    // Keep your existing methods below (scoreCVText, getScoreHistory, getScore, clearCache)
    // They remain unchanged from your original file

    public function scoreCVText(Request $request)
    {
        // Keep your existing implementation
        $validator = Validator::make($request->all(), [
            'cv_text' => 'required|string',
            'job_requirements' => 'required|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $cvData = [
                'skills' => $this->extractSkillsFromText($request->cv_text),
                'years_of_experience' => 0
            ];
            
            $scoreResult = $this->calculateScoreWithWeights($cvData, $request->job_requirements, ScoringWeight::getDefaultWeights());
            
            return response()->json([
                'success' => true,
                'data' => array_merge($scoreResult, ['fallback' => true])
            ]);
        } catch (\Exception $e) {
            Log::error('CV Scoring error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error scoring CV: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getScoreHistory($cvId)
    {
        try {
            $cv = Cv::where('user_id', auth()->id())->findOrFail($cvId);
            
            $scores = CvScore::where('cv_id', $cv->id)
                ->with(['job.company', 'application'])
                ->orderBy('scored_at', 'desc')
                ->get()
                ->map(function ($score) {
                    return [
                        'id' => $score->id,
                        'total_score' => $score->total_score,
                        'breakdown' => $score->score_breakdown,
                        'matched_skills' => $score->matched_skills,
                        'missing_skills' => $score->missing_skills,
                        'bge_analysis' => $score->bge_analysis,
                        'scored_at' => $score->scored_at->format('Y-m-d H:i:s'),
                        'job' => $score->job ? [
                            'id' => $score->job->id,
                            'title' => $score->job->title,
                            'company_name' => $score->job->company->name ?? 'Unknown Company'
                        ] : null,
                        'application_id' => $score->application_id
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $scores
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching score history: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error fetching score history'
            ], 500);
        }
    }

    public function getScore($scoreId)
    {
        try {
            $score = CvScore::with(['cv', 'job.company', 'application'])
                ->whereHas('cv', function ($query) {
                    $query->where('user_id', auth()->id());
                })
                ->findOrFail($scoreId);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $score->id,
                    'total_score' => $score->total_score,
                    'breakdown' => $score->score_breakdown,
                    'matched_skills' => $score->matched_skills,
                    'missing_skills' => $score->missing_skills,
                    'bge_analysis' => $score->bge_analysis,
                    'scored_at' => $score->scored_at->format('Y-m-d H:i:s'),
                    'cv' => [
                        'id' => $score->cv->id,
                        'title' => $score->cv->title
                    ],
                    'job' => $score->job ? [
                        'id' => $score->job->id,
                        'title' => $score->job->title,
                        'description' => $score->job->description,
                        'company_name' => $score->job->company->name ?? 'Unknown Company',
                        'required_skills' => $score->job->required_skills
                    ] : null,
                    'application_id' => $score->application_id
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching score: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Score not found'
            ], 404);
        }
    }

    public function clearCache()
    {
        try {
            $response = Http::delete($this->scoringServiceUrl . '/cache/clear');
            
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Cache cleared successfully'
                ]);
            }
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache'
            ], 500);
        } catch (\Exception $e) {
            Log::error('Error clearing cache: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Error clearing cache'
            ], 500);
        }
    }
}