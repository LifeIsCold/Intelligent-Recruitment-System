<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SavedJobController extends Controller
{
    /**
     * Get user's saved jobs
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            $savedJobs = $user->savedJobs()
                ->with(['company', 'industry'])
                ->paginate(20);

            // Format the response to match your existing job format
            $formattedJobs = $savedJobs->map(function ($job) {
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
                    'saved_at' => $job->pivot->created_at ? $job->pivot->created_at->toISOString() : null,
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
                    'industry_name' => $job->industry->name ?? 'General'
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedJobs,
                'meta' => [
                    'total' => $savedJobs->total(),
                    'per_page' => $savedJobs->perPage(),
                    'current_page' => $savedJobs->currentPage(),
                    'last_page' => $savedJobs->lastPage(),
                ],
                'message' => 'Saved jobs retrieved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error fetching saved jobs: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch saved jobs',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Save a job
     */
    public function store(Request $request, $jobId)
    {
        try {
            $user = $request->user();
            
            // Check if job exists
            $job = Job::find($jobId);
            if (!$job) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found'
                ], 404);
            }

            // Check if already saved
            if ($user->savedJobs()->where('job_id', $jobId)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job already saved'
                ], 400);
            }

            // Save the job
            $user->savedJobs()->attach($jobId);

            Log::info('Job saved', [
                'user_id' => $user->id,
                'job_id' => $jobId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Job saved successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Error saving job: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to save job',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Remove a saved job
     */
    public function destroy(Request $request, $jobId)
    {
        try {
            $user = $request->user();

            // Check if job exists in saved list
            if (!$user->savedJobs()->where('job_id', $jobId)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Job not found in saved list'
                ], 404);
            }

            // Remove the saved job
            $user->savedJobs()->detach($jobId);

            Log::info('Job removed from saved', [
                'user_id' => $user->id,
                'job_id' => $jobId
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Job removed from saved list'
            ]);

        } catch (\Exception $e) {
            Log::error('Error removing saved job: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to remove saved job',
                'error' => env('APP_DEBUG') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Check if a specific job is saved
     */
    public function check(Request $request, $jobId)
    {
        try {
            $user = $request->user();
            
            $isSaved = $user->savedJobs()->where('job_id', $jobId)->exists();

            return response()->json([
                'success' => true,
                'data' => [
                    'is_saved' => $isSaved
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error checking saved status: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to check saved status'
            ], 500);
        }
    }
}