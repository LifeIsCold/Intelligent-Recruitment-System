<?php

namespace App\Http\Controllers\Api;

use App\Models\Job;
use App\Models\Application;
use App\Models\Cv;
use App\Models\ScoringWeight;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class JobController extends Controller
{
    /**
     * Get all OPEN jobs (for job seekers)
     */
    public function index(Request $request)
    {
        try {
            Log::info('JobController@index called', [
                'user_id' => $request->user()->id ?? 'none',
                'user_role' => $request->user()->role ?? 'none'
            ]);
            
            $user = $request->user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication required'
                ], 401);
            }
            
            $query = Job::query();
            $query->where('status', 'open');
            $query->with(['company', 'industry', 'creator']);
            $query->orderBy('created_at', 'desc');
            
            $perPage = $request->per_page ?? 20;
            $jobs = $query->paginate($perPage);
            
            $formattedJobs = $jobs->map(function ($job) {
                return [
                    'id' => $job->id,
                    'title' => $job->title ?? 'Untitled Position',
                    'description' => $job->description ?? '',
                    'status' => $job->status ?? 'open',
                    'work_type' => $job->work_type ?? 'remote',
                    'work_time' => $job->work_time ?? 'full_time',
                    'salary' => $job->salary ?? 'Negotiable',
                    'required_skills' => $job->required_skills ?? [],
                    'benefits' => $job->benefits ?? '',
                    'created_at' => $job->created_at ? $job->created_at->toISOString() : now()->toISOString(),
                    'closes_at' => $job->closes_at ? $job->closes_at->toISOString() : null,
                    'company' => $job->company ? [
                        'id' => $job->company->id,
                        'name' => $job->company->name ?? 'Unknown Company',
                        'website' => $job->company->website ?? null
                    ] : null,
                    'industry' => $job->industry ? [
                        'id' => $job->industry->id,
                        'name' => $job->industry->name ?? 'General'
                    ] : null,
                    'company_name' => $job->company->name ?? 'Unknown Company',
                    'industry_name' => $job->industry->name ?? 'General',
                    'scoring_weights' => $job->getScoringWeights()
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $formattedJobs,
                'meta' => [
                    'total' => $jobs->total(),
                    'per_page' => $jobs->perPage(),
                    'current_page' => $jobs->currentPage(),
                    'last_page' => $jobs->lastPage(),
                ],
                'message' => 'Showing all open jobs'
            ]);
            
        } catch (\Exception $e) {
            Log::error('JobController@index error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch jobs',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Get recruiter's own jobs (with applications)
     */
    public function getRecruiterJobs(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user->role !== 'recruiter') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - Recruiter access only'
                ], 403);
            }
            
            if (!$user->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You need to be associated with a company to view jobs'
                ], 400);
            }
            
            $jobs = Job::with(['company', 'industry', 'applications.user', 'scoringWeight'])
                ->where('company_id', $user->company_id)
                ->orderBy('created_at', 'desc')
                ->get();
            
            $formattedJobs = $jobs->map(function ($job) {
                return [
                    'id' => $job->id,
                    'title' => $job->title ?? 'Untitled Position',
                    'description' => $job->description ?? '',
                    'status' => $job->status ?? 'open',
                    'work_type' => $job->work_type ?? 'remote',
                    'work_time' => $job->work_time ?? 'full_time',
                    'salary' => $job->salary ?? 'Negotiable',
                    'required_skills' => $job->required_skills ?? [],
                    'benefits' => $job->benefits ?? '',
                    'created_at' => $job->created_at ? $job->created_at->toISOString() : now()->toISOString(),
                    'closes_at' => $job->closes_at ? $job->closes_at->toISOString() : null,
                    'company' => $job->company ? [
                        'id' => $job->company->id,
                        'name' => $job->company->name ?? 'Unknown Company',
                        'website' => $job->company->website ?? null
                    ] : null,
                    'industry' => $job->industry ? [
                        'id' => $job->industry->id,
                        'name' => $job->industry->name ?? 'General'
                    ] : null,
                    'company_name' => $job->company->name ?? 'Unknown Company',
                    'industry_name' => $job->industry->name ?? 'General',
                    'applications_count' => $job->applications->count(),
                    'scoring_weights' => $job->getScoringWeights(),
                    'applications' => $job->applications->map(function ($application) {
                        return [
                            'id' => $application->id,
                            'user_id' => $application->user_id,
                            'user' => $application->user ? [
                                'id' => $application->user->id,
                                'name' => $application->user->name,
                                'email' => $application->user->email,
                                'phone' => $application->user->phone
                            ] : null,
                            'match_score' => $application->match_score ?? 0,
                            'status' => $application->status ?? 'pending',
                            'applied_at' => $application->applied_at ? $application->applied_at->toISOString() : 
                                          ($application->created_at ? $application->created_at->toISOString() : null),
                            'notes' => $application->notes ?? ''
                        ];
                    })
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $formattedJobs,
                'company' => $user->company,
                'total' => $jobs->count(),
                'message' => 'Showing your posted jobs'
            ]);
            
        } catch (\Exception $e) {
            Log::error('JobController@getRecruiterJobs error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch recruiter jobs',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Create a new job
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'industry_id' => 'required|exists:industries,id',
                'work_type' => 'required|in:remote,onsite',
                'work_time' => 'required|in:full_time,part_time,contract',
                'salary' => 'nullable|string',
                'required_skills' => 'nullable|array',
                'required_skills.*' => 'string',
                'benefits' => 'nullable|string',
                'status' => 'required|in:open,closed',
                'closes_at' => 'nullable|date|after:now',
                'scoring_weights' => 'required|array',
                'scoring_weights.required_skills_weight' => 'required|integer|min:0|max:100',
                'scoring_weights.preferred_skills_weight' => 'required|integer|min:0|max:100',
                'scoring_weights.experience_weight' => 'required|integer|min:0|max:100',
                'scoring_weights.education_weight' => 'required|integer|min:0|max:100',
                'scoring_weights.similarity_threshold' => 'required|numeric|min:0|max:1'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Validate weights total equals 100
            $weights = $request->scoring_weights;
            $total = $weights['required_skills_weight'] + $weights['preferred_skills_weight'] + 
                     $weights['experience_weight'] + $weights['education_weight'];
            
            if ($total !== 100) {
                return response()->json([
                    'success' => false,
                    'message' => 'Scoring weights must total 100%',
                    'errors' => ['scoring_weights' => ['Total must equal 100%, currently ' . $total . '%']]
                ], 422);
            }
            
            $user = $request->user();
            
            if ($user->role !== 'recruiter') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only recruiters can post jobs'
                ], 403);
            }
            
            if (!$user->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You need to be associated with a company to post jobs'
                ], 400);
            }
            
            // Create the job
            $job = Job::create([
                'title' => $request->title,
                'description' => $request->description,
                'company_id' => $user->company_id,
                'industry_id' => $request->industry_id,
                'created_by' => $user->id,
                'status' => $request->status,
                'work_type' => $request->work_type,
                'work_time' => $request->work_time,
                'salary' => $request->salary,
                'required_skills' => $request->required_skills ?? [],
                'benefits' => $request->benefits,
                'closes_at' => $request->closes_at,
            ]);
            
            // Create scoring weights for the job
            ScoringWeight::create([
                'weightable_type' => Job::class,
                'weightable_id' => $job->id,
                'type' => 'job',
                'required_skills_weight' => $weights['required_skills_weight'],
                'preferred_skills_weight' => $weights['preferred_skills_weight'],
                'experience_weight' => $weights['experience_weight'],
                'education_weight' => $weights['education_weight'],
                'similarity_threshold' => $weights['similarity_threshold'],
                'is_active' => true
            ]);
            
            Log::info('Job created with scoring weights', [
                'job_id' => $job->id,
                'user_id' => $user->id,
                'company_id' => $user->company_id,
                'weights' => $weights
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Job posted successfully',
                'data' => $job->load('scoringWeight')
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('JobController@store error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create job',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Update a job
     */
    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'description' => 'required|string',
                'industry_id' => 'required|exists:industries,id',
                'work_type' => 'required|in:remote,onsite',
                'work_time' => 'required|in:full_time,part_time,contract',
                'salary' => 'nullable|string',
                'required_skills' => 'nullable|array',
                'required_skills.*' => 'string',
                'benefits' => 'nullable|string',
                'status' => 'required|in:open,closed',
                'closes_at' => 'nullable|date|after:now',
                'scoring_weights' => 'required|array',
                'scoring_weights.required_skills_weight' => 'required|integer|min:0|max:100',
                'scoring_weights.preferred_skills_weight' => 'required|integer|min:0|max:100',
                'scoring_weights.experience_weight' => 'required|integer|min:0|max:100',
                'scoring_weights.education_weight' => 'required|integer|min:0|max:100',
                'scoring_weights.similarity_threshold' => 'required|numeric|min:0|max:1'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Validate weights total equals 100
            $weights = $request->scoring_weights;
            $total = $weights['required_skills_weight'] + $weights['preferred_skills_weight'] + 
                     $weights['experience_weight'] + $weights['education_weight'];
            
            if ($total !== 100) {
                return response()->json([
                    'success' => false,
                    'message' => 'Scoring weights must total 100%',
                    'errors' => ['scoring_weights' => ['Total must equal 100%, currently ' . $total . '%']]
                ], 422);
            }
            
            $job = Job::find($id);
            
            if (!$job) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found'
                ], 404);
            }
            
            $user = $request->user();
            
            if ($job->company_id !== $user->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized - You can only update jobs from your company'
                ], 403);
            }
            
            // Update job
            $job->update([
                'title' => $request->title,
                'description' => $request->description,
                'industry_id' => $request->industry_id,
                'work_type' => $request->work_type,
                'work_time' => $request->work_time,
                'salary' => $request->salary,
                'required_skills' => $request->required_skills ?? [],
                'benefits' => $request->benefits,
                'status' => $request->status,
                'closes_at' => $request->closes_at,
            ]);
            
            // Update or create scoring weights
            $scoringWeight = ScoringWeight::where('weightable_type', Job::class)
                ->where('weightable_id', $job->id)
                ->where('type', 'job')
                ->first();
            
            if ($scoringWeight) {
                // Deactivate old weight
                $scoringWeight->update(['is_active' => false]);
            }
            
            // Create new weights
            ScoringWeight::create([
                'weightable_type' => Job::class,
                'weightable_id' => $job->id,
                'type' => 'job',
                'required_skills_weight' => $weights['required_skills_weight'],
                'preferred_skills_weight' => $weights['preferred_skills_weight'],
                'experience_weight' => $weights['experience_weight'],
                'education_weight' => $weights['education_weight'],
                'similarity_threshold' => $weights['similarity_threshold'],
                'is_active' => true
            ]);
            
            Log::info('Job updated with scoring weights', [
                'job_id' => $job->id,
                'user_id' => $user->id,
                'weights' => $weights
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Job updated successfully',
                'data' => $job->load('scoringWeight')
            ]);
            
        } catch (\Exception $e) {
            Log::error('JobController@update error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update job',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Delete a job
     */
    public function destroy($id)
    {
        try {
            $job = Job::find($id);
            
            if (!$job) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found'
                ], 404);
            }
            
            $user = auth()->user();
            
            if ($job->company_id !== $user->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only delete jobs from your own company'
                ], 403);
            }
            
            // Delete associated applications first
            $job->applications()->delete();
            
            // Delete associated scoring weights
            ScoringWeight::where('weightable_type', Job::class)
                ->where('weightable_id', $job->id)
                ->delete();
            
            $job->delete();
            
            Log::info('Job deleted', [
                'job_id' => $id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Job deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('JobController@destroy error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete job',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Update job status (open/closed)
     */
    public function updateJobStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:open,closed'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $job = Job::find($id);
            
            if (!$job) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found'
                ], 404);
            }
            
            $user = auth()->user();
            
            if ($job->company_id !== $user->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized'
                ], 403);
            }
            
            $job->update(['status' => $request->status]);
            
            Log::info('Job status updated', [
                'job_id' => $job->id,
                'status' => $request->status,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Job status updated',
                'data' => $job
            ]);
            
        } catch (\Exception $e) {
            Log::error('JobController@updateJobStatus error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update job status',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Get job applications
     */
    public function getJobApplications($jobId)
    {
        try {
            $job = Job::with('company')->find($jobId);
            
            if (!$job) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found'
                ], 404);
            }
            
            $user = auth()->user();
            
            if ($job->company_id !== $user->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to view applications for this job'
                ], 403);
            }
            
            $applications = Application::with(['user', 'cv', 'user.skills'])
                ->where('job_id', $jobId)
                ->orderBy('match_score', 'desc')
                ->get();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'job' => $job,
                    'applications' => $applications,
                    'total' => $applications->count()
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('JobController@getJobApplications error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch applications',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Apply for a job (job seekers only)
     */
    public function apply(Request $request, $jobId)
    {
        try {
            $user = $request->user();
            
            if ($user->role !== 'job_seeker') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only job seekers can apply for jobs'
                ], 403);
            }
            
            $job = Job::find($jobId);
            
            if (!$job) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found'
                ], 404);
            }
            
            if ($job->status !== 'open') {
                return response()->json([
                    'success' => false,
                    'message' => 'This job is no longer accepting applications'
                ], 400);
            }
            
            $validator = Validator::make($request->all(), [
                'cv_id' => 'required|exists:cvs,id'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            $existingApplication = Application::where('user_id', $user->id)
                ->where('job_id', $jobId)
                ->first();
                
            if ($existingApplication) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have already applied for this job',
                    'data' => [
                        'application_id' => $existingApplication->id,
                        'status' => $existingApplication->status
                    ]
                ], 400);
            }
            
            $application = Application::create([
                'job_id' => $jobId,
                'user_id' => $user->id,
                'cv_id' => $request->cv_id,
                'status' => Application::STATUS_PENDING,
                'applied_at' => now()
            ]);
            
            $matchScore = null;
            try {
                $scoringController = app(CVScoringController::class);
                $scoreRequest = new Request([
                    'job_id' => $jobId,
                    'application_id' => $application->id
                ]);
                
                $scoreResponse = $scoringController->scoreCV($scoreRequest, $request->cv_id);
                $scoreData = $scoreResponse->getData();
                
                if ($scoreData->success) {
                    $matchScore = $scoreData->data->total_score;
                    $application->update(['match_score' => $matchScore]);
                }
            } catch (\Exception $e) {
                Log::warning('Could not get CV score during application: ' . $e->getMessage());
                $cv = Cv::find($request->cv_id);
                $matchScore = $this->calculateSimpleMatchScore($cv, $job);
                $application->update(['match_score' => $matchScore]);
            }
            
            Log::info('Job application submitted', [
                'job_id' => $jobId,
                'user_id' => $user->id,
                'application_id' => $application->id,
                'match_score' => $matchScore
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Application submitted successfully',
                'data' => $application->load('job.company'),
                'match_score' => $matchScore
            ]);
            
        } catch (\Exception $e) {
            Log::error('JobController@apply error: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit application',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
    
    /**
     * Calculate simple match score (fallback)
     */
    private function calculateSimpleMatchScore($cv, $job)
    {
        if (!$cv || !$cv->extracted_skills || !$job->required_skills) {
            return 50;
        }
        
        $cvSkills = $cv->extracted_skills ?? [];
        $jobSkills = $job->required_skills ?? [];
        
        $matchingSkills = array_intersect($cvSkills, $jobSkills);
        $matchCount = count($matchingSkills);
        $totalSkills = count($jobSkills);
        
        if ($totalSkills > 0) {
            return min(100, ($matchCount / $totalSkills) * 100);
        }
        
        return 50;
    }
}