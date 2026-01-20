<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cv;

class CvController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content' => 'required|string|min:10'
        ]);

        $cv = \App\Models\Cv::create($validated);

        return response()->json([
            'message' => 'CV created successfully',
            'data' => $cv
        ], 201);
    }
    // public function store(Request $request)
    // {
    //     return response()->json($request->all());
    // }
    public function index()
    {
        return response()->json(Cv::latest()->get());
    }
}
