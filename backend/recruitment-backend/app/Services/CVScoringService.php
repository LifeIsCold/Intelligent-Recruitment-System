<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\UploadedFile;

class CVScoringService
{
    protected $baseUrl;
    
    public function __construct()
    {
        $this->baseUrl = env('CV_SCORING_SERVICE_URL', 'http://localhost:8001');
    }
    
    public function scoreCV($file, array $requirements)
    {
        try {
            $response = Http::attach(
                'file', 
                file_get_contents($file->getPathname()), 
                $file->getClientOriginalName()
            )->post($this->baseUrl . '/score-cv', [
                'requirements' => json_encode($requirements)
            ]);
            
            if ($response->successful()) {
                return $response->json();
            }
            
            return null;
        } catch (\Exception $e) {
            \Log::error('CV Scoring Error: ' . $e->getMessage());
            return null;
        }
    }
    
    public function scoreCVText(string $text, array $requirements)
    {
        try {
            $response = Http::post($this->baseUrl . '/score-cv', [
                'cv_text' => $text,
                'requirements' => json_encode($requirements)
            ]);
            
            if ($response->successful()) {
                return $response->json();
            }
            
            return null;
        } catch (\Exception $e) {
            \Log::error('CV Scoring Error: ' . $e->getMessage());
            return null;
        }
    }
}