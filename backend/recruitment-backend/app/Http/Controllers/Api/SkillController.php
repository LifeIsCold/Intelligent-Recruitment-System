<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Skill;
use Illuminate\Http\Request;

class SkillController extends Controller
{
    /**
     * Get all skills
     */
    public function index()
    {
        try {
            $skills = Skill::all();
            
            return response()->json([
                'success' => true,
                'message' => 'Skills retrieved successfully',
                'data' => $skills
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve skills: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add skills to a user
     */
    public function addSkillsToUser(Request $request)
    {
        try {
            $user = $request->user();
            
            $validated = $request->validate([
                'skills' => 'required|array',
                'skills.*.skill_id' => 'required|exists:skills,id',
                'skills.*.proficiency' => 'nullable|integer|min:1|max:5'
            ]);

            foreach ($validated['skills'] as $skill) {
                $user->skills()->syncWithoutDetaching([
                    $skill['skill_id'] => ['proficiency' => $skill['proficiency'] ?? 3]
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Skills added successfully',
                'user' => $user->load('skills')
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add skills: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's skills
     */
    public function getUserSkills(Request $request)
    {
        try {
            $user = $request->user();
            $skills = $user->skills()->get();

            return response()->json([
                'success' => true,
                'message' => 'User skills retrieved',
                'data' => $skills
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user skills: ' . $e->getMessage()
            ], 500);
        }
    }
}
