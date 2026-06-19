<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

class UserController extends Controller
{
    // Add skills to user
    public function addSkills(Request $request)
    {
        $request->validate([
            'skills' => 'required|array',
            'skills.*' => 'exists:skills,id'
        ]);
        
        $user = $request->user();
        $user->skills()->sync($request->skills);
        
        return response()->json([
            'success' => true,
            'message' => 'Skills updated successfully',
            'data' => $user->skills
        ]);
    }
    
    // Get user's skills
    public function getSkills(Request $request)
    {
        $user = $request->user()->load('skills');
        
        return response()->json([
            'success' => true,
            'data' => $user->skills
        ]);
    }
}