<?php
// app/Http/Controllers/Api/ScoringWeightController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScoringWeight;
use App\Models\Job;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ScoringWeightController extends Controller
{
    // Get global weights (admin only)
    public function getGlobalWeights()
    {
        // Check if user is admin
        if (Auth::user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $weights = ScoringWeight::where('weightable_type', 'global')
            ->where('type', 'global')
            ->where('is_active', true)
            ->first();
            
        if (!$weights) {
            $weights = ScoringWeight::getDefaultWeights();
            return response()->json(['success' => true, 'data' => $weights]);
        }
        
        return response()->json(['success' => true, 'data' => $weights]);
    }
    
    // Update global weights (admin only)
    public function updateGlobalWeights(Request $request)
    {
        if (Auth::user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'required_skills_weight' => 'integer|min:0|max:100',
            'preferred_skills_weight' => 'integer|min:0|max:100',
            'experience_weight' => 'integer|min:0|max:100',
            'education_weight' => 'integer|min:0|max:100',
            'similarity_threshold' => 'numeric|min:0|max:1'
        ]);
        
        // Deactivate old weights
        ScoringWeight::where('weightable_type', 'global')
            ->where('type', 'global')
            ->update(['is_active' => false]);
        
        // Create new weights
        $weights = ScoringWeight::create([
            'weightable_type' => 'global',
            'weightable_id' => 1,
            'type' => 'global',
            'required_skills_weight' => $validated['required_skills_weight'] ?? 75,
            'preferred_skills_weight' => $validated['preferred_skills_weight'] ?? 0,
            'experience_weight' => $validated['experience_weight'] ?? 20,
            'education_weight' => $validated['education_weight'] ?? 5,
            'similarity_threshold' => $validated['similarity_threshold'] ?? 0.6,
            'is_active' => true
        ]);
        
        return response()->json(['success' => true, 'data' => $weights]);
    }
    
    // Get company weights
    public function getCompanyWeights(Company $company)
    {
        // Check if user belongs to this company
        if (Auth::user()->company_id !== $company->id && Auth::user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $weights = $company->scoringWeight;
        
        if (!$weights) {
            $weights = ScoringWeight::getDefaultWeights();
            return response()->json(['success' => true, 'data' => $weights]);
        }
        
        return response()->json(['success' => true, 'data' => $weights]);
    }
    
    // Update company weights
    public function updateCompanyWeights(Request $request, Company $company)
    {
        if (Auth::user()->company_id !== $company->id && Auth::user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'required_skills_weight' => 'integer|min:0|max:100',
            'preferred_skills_weight' => 'integer|min:0|max:100',
            'experience_weight' => 'integer|min:0|max:100',
            'education_weight' => 'integer|min:0|max:100',
            'similarity_threshold' => 'numeric|min:0|max:1'
        ]);
        
        // Deactivate old weights
        ScoringWeight::where('weightable_type', Company::class)
            ->where('weightable_id', $company->id)
            ->where('type', 'company')
            ->update(['is_active' => false]);
        
        // Create new weights
        $weights = ScoringWeight::create([
            'weightable_type' => Company::class,
            'weightable_id' => $company->id,
            'type' => 'company',
            'required_skills_weight' => $validated['required_skills_weight'] ?? 75,
            'preferred_skills_weight' => $validated['preferred_skills_weight'] ?? 0,
            'experience_weight' => $validated['experience_weight'] ?? 20,
            'education_weight' => $validated['education_weight'] ?? 5,
            'similarity_threshold' => $validated['similarity_threshold'] ?? 0.6,
            'is_active' => true
        ]);
        
        return response()->json(['success' => true, 'data' => $weights]);
    }
    
    // Get job weights
    public function getJobWeights(Job $job)
    {
        $weights = $job->getScoringWeights();
        return response()->json(['success' => true, 'data' => $weights]);
    }
    
    // Update job weights
    public function updateJobWeights(Request $request, Job $job)
    {
        // Check if user owns this job
        if ($job->created_by !== Auth::id() && Auth::user()->role !== 'admin') {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        
        $validated = $request->validate([
            'required_skills_weight' => 'integer|min:0|max:100',
            'preferred_skills_weight' => 'integer|min:0|max:100',
            'experience_weight' => 'integer|min:0|max:100',
            'education_weight' => 'integer|min:0|max:100',
            'similarity_threshold' => 'numeric|min:0|max:1'
        ]);
        
        // Deactivate old weights
        ScoringWeight::where('weightable_type', Job::class)
            ->where('weightable_id', $job->id)
            ->where('type', 'job')
            ->update(['is_active' => false]);
        
        // Create new weights
        $weights = ScoringWeight::create([
            'weightable_type' => Job::class,
            'weightable_id' => $job->id,
            'type' => 'job',
            'required_skills_weight' => $validated['required_skills_weight'] ?? 75,
            'preferred_skills_weight' => $validated['preferred_skills_weight'] ?? 0,
            'experience_weight' => $validated['experience_weight'] ?? 20,
            'education_weight' => $validated['education_weight'] ?? 5,
            'similarity_threshold' => $validated['similarity_threshold'] ?? 0.6,
            'is_active' => true
        ]);
        
        return response()->json(['success' => true, 'data' => $weights]);
    }
}