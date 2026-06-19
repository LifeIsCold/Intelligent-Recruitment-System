<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Industry;
use Illuminate\Http\Request;

class IndustryController extends Controller
{
    /**
     * Get all industries
     */
    public function index()
    {
        try {
            $industries = Industry::all();
            
            return response()->json([
                'success' => true,
                'message' => 'Industries retrieved successfully',
                'data' => $industries
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve industries: ' . $e->getMessage()
            ], 500);
        }
    }
}
