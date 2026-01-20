<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class MatchController extends Controller
{
    // POST /api/match
    public function match(Request $request)
    {
        $validated = $request->validate([
            'cv_id' => 'required|integer',
            'job_id' => 'required|integer',
        ]);

        // Dummy response for now (ML will replace this later)
        return response()->json([
            'cv_id' => $validated['cv_id'],
            'job_id' => $validated['job_id'],
            'score' => 0.72,
            'matched_skills' => ['PHP', 'Laravel'],
            'missing_skills' => ['React'],
        ]);
    }
}
