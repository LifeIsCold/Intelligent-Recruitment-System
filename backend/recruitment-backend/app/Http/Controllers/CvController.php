<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cv;

class CvController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'content' => 'required|string'
        ]);

        $cv = Cv::create([
            'content' => $request->content
        ]);

        return response()->json([
            'message' => 'CV stored successfully',
            'data' => $cv
        ], 201);
    }
}
