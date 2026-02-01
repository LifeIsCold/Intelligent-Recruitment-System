<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Job;
use Illuminate\Http\Request;

class JobController extends Controller
{
    // GET /api/jobs
    public function index()
    {
        $jobs = Job::with(['company', 'industry', 'creator'])->latest()->get();

        return response()->json([
            'success' => true,
            'data' => $jobs
        ]);
    }

    // POST /api/jobs
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'company_id' => 'required|exists:companies,id',
            'industry_id' => 'required|exists:industries,id',
            'created_by' => 'nullable|exists:users,id', // Keep this
            'work_type' => 'required|in:remote,onsite',
            'work_time' => 'required|in:full_time,part_time',
            'salary' => 'nullable|string',
            'benefits' => 'nullable|string',
            'required_skills' => 'required|array',
            'required_skills.*' => 'string',
        ]);

        try {
            // Get the authenticated user's ID
            $userId = $request->user() ? $request->user()->id : null;
            
            // Use provided created_by OR authenticated user's ID
            $createdBy = $validated['created_by'] ?? $userId;

            $job = Job::create([
                'title' => $validated['title'],
                'description' => $validated['description'],
                'company_id' => $validated['company_id'],
                'industry_id' => $validated['industry_id'],
                'created_by' => $createdBy, // This should work now
                'work_type' => $validated['work_type'],
                'work_time' => $validated['work_time'],
                'salary' => $validated['salary'] ?? 'Negotiable',
                'benefits' => $validated['benefits'] ?? null,
                'required_skills' => $validated['required_skills'],
                'status' => 'open',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Job created successfully',
                'data' => $job
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create job: ' . $e->getMessage()
            ], 500);
        }
    }
    public function destroy(Job $job)
    {
        try {
            // Optional: Check if user is authorized to delete this job
            // $user = request()->user();
            // if ($job->created_by !== $user->id && $user->role !== 'admin') {
            //     return response()->json(['message' => 'Unauthorized'], 403);
            // }
            
            $job->delete();
            
            return response()->json([
                'success' => true,
                'message' => 'Job deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete job: ' . $e->getMessage()
            ], 500);
        }
    }
    // GET /api/recruiter/jobs
    public function recruiterJobs(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'recruiter') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Prefer filtering by company_id so recruiters see jobs posted by their company.
        // Fall back to jobs created by the user if company_id is not set on the user.
        $query = Job::with(['applications.cv']); // Include applications and their CVs

        if (!empty($user->company_id)) {
            $query->where('company_id', $user->company_id);
        } else {
            $query->where('created_by', $user->id);
        }

        $jobs = $query->get();

        return response()->json([
            'success' => true,
            'data' => $jobs
        ]);
    }
}
