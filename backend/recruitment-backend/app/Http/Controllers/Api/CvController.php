<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cv;
use App\Models\Skill;
use App\Services\ExcelCvParser;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class CvController extends Controller
{
    protected $excelParser;

    public function __construct(ExcelCvParser $excelParser)
    {
        $this->excelParser = $excelParser;
    }

    /**
     * Get user's CVs
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $cvs = $user->cvs()->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $cvs,
            'default_cv_id' => $user->cvs()->where('is_default', true)->value('id'),
        ]);
    }

    /**
     * Upload new CV (Excel or Text)
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'cv_file' => 'nullable|file|mimes:xls,xlsx|max:5120',
                'cv_content' => 'nullable|string|max:50000',
                'is_default' => 'boolean'
            ]);
            
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }
            
            // Check if at least one of file or content is provided
            if (!$request->hasFile('cv_file') && empty($request->cv_content)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please provide either an Excel file or CV content'
                ], 422);
            }
            
            $user = $request->user();
            $isDefault = filter_var($request->input('is_default', false), FILTER_VALIDATE_BOOLEAN);
            
            // If setting to default, update all other CVs to non-default
            if ($isDefault) {
                Cv::where('user_id', $user->id)->update(['is_default' => false]);
            }
            
            $cvData = [
                'user_id' => $user->id,
                'title' => $request->title,
                'is_default' => $isDefault,
                'file_type' => 'text', // Default to text
                'parsed_at' => now()
            ];
            
            // Handle file upload if present
            if ($request->hasFile('cv_file')) {
                $file = $request->file('cv_file');
                $extension = $file->getClientOriginalExtension();
                
                // Generate unique filename
                $fileName = time() . '_' . uniqid() . '.' . $extension;
                $path = $file->storeAs('cvs', $fileName, 'public');
                
                $cvData['original_filename'] = $file->getClientOriginalName();
                $cvData['storage_path'] = $path;
                $cvData['file_type'] = 'excel';
                
                // Parse Excel file
                try {
                    $parsedData = $this->excelParser->parse($file);
                    $cvData['structured_data'] = $parsedData;
                    
                    // Use the skills directly from parsed data (raw extraction)
                    $rawSkills = $parsedData['skills'] ?? [];
                    $cvData['extracted_skills'] = $rawSkills;
                    
                    // Also get experience and education from parsed data
                    $cvData['experience_years'] = $parsedData['experience_years'] ?? null;
                    $cvData['education_level'] = $parsedData['education_level'] ?? null;
                    
                    // Extract text content from parsed data for searching
                    $cvData['text_content'] = $this->extractTextFromParsedData($parsedData);
                    
                    Log::info('Excel CV parsed successfully', [
                        'skills_count' => count($rawSkills),
                        'experience_years' => $cvData['experience_years']
                    ]);
                    
                } catch (\Exception $e) {
                    Log::error('Excel parsing error: ' . $e->getMessage());
                    // Continue with basic info even if parsing fails
                    $cvData['text_content'] = "Excel file: " . $file->getClientOriginalName();
                }
            } 
            // Handle text content
            elseif (!empty($request->cv_content)) {
                $cvData['text_content'] = $request->cv_content;
                $cvData['extracted_skills'] = $this->extractSkillsFromText($request->cv_content);
                
                // Try to extract experience years from text
                $cvData['experience_years'] = $this->extractExperienceFromText($request->cv_content);
                
                Log::info('Text CV processed', [
                    'content_length' => strlen($request->cv_content),
                    'skills_extracted' => count($cvData['extracted_skills'] ?? [])
                ]);
            }
            
            // Create CV record
            $cv = Cv::create($cvData);
            
            // Sync user skills if skills were extracted (only those that exist in skills table)
            if (!empty($cvData['extracted_skills'])) {
                $this->syncUserSkills($cv, $user);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'CV uploaded successfully',
                'data' => $cv
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('CV Upload Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload CV: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Extract text from parsed Excel data
     */
    private function extractTextFromParsedData($parsedData)
    {
        $text = '';
        
        if (!is_array($parsedData)) {
            return $text;
        }
        
        foreach ($parsedData as $key => $value) {
            if (is_string($value)) {
                $text .= $value . ' ';
            } elseif (is_array($value)) {
                $text .= implode(' ', $value) . ' ';
            }
        }
        
        return trim($text);
    }

    /**
     * Extract skills from text content
     */
    private function extractSkillsFromText($text)
    {
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
        
        return $foundSkills;
    }

    /**
     * Extract experience years from text
     */
    private function extractExperienceFromText($text)
    {
        $patterns = [
            '/(\d+)[\+]?\s*years?\s*(?:of)?\s*experience/i',
            '/(\d+)[\+]?\s*yr?s?\s*(?:of)?\s*experience/i',
            '/(\d+)[\+]?\s*years?\s*(?:of)?\s*work/i',
            '/(\d+)[\+]?\s*years?\s*(?:of)?\s*professional/i'
        ];
        
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return (int)$matches[1];
            }
        }
        
        return null;
    }

    /**
     * Sync user skills based on CV content
     */
    private function syncUserSkills($cv, $user)
    {
        $skills = $cv->extracted_skills ?? [];
        
        if (!empty($skills)) {
            $skillIds = Skill::whereIn('name', $skills)->pluck('id')->toArray();
            
            if (!empty($skillIds)) {
                $user->skills()->syncWithoutDetaching($skillIds);
            }
        }
    }

    /**
     * Set a CV as default
     */
    public function setDefault(Request $request, $id)
    {
        $cv = $request->user()->cvs()->findOrFail($id);
        
        // Update all CVs to non-default first
        $request->user()->cvs()->update(['is_default' => false]);
        
        // Set this CV as default
        $cv->update(['is_default' => true]);

        return response()->json([
            'success' => true,
            'message' => 'CV set as default successfully.'
        ]);
    }

    /**
     * Delete a CV
     */
    public function destroy(Request $request, $id)
    {
        $cv = $request->user()->cvs()->findOrFail($id);

        // Delete file if it exists
        if ($cv->storage_path && Storage::disk('public')->exists($cv->storage_path)) {
            Storage::disk('public')->delete($cv->storage_path);
        }

        $cv->delete();

        return response()->json([
            'success' => true,
            'message' => 'CV deleted successfully.'
        ]);
    }

    /**
     * Download CV file
     */
    public function download($id)
    {
        $cv = Cv::findOrFail($id);
        
        if (!$cv->storage_path || !Storage::disk('public')->exists($cv->storage_path)) {
            abort(404, 'File not found');
        }

        return Storage::disk('public')->download($cv->storage_path, $cv->original_filename ?? 'cv.xlsx');
    }
}