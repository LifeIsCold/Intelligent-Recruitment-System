<?php

namespace App\Http\Controllers\Api;

use App\Models\SiteStat;
use Illuminate\Http\JsonResponse;
use App\Http\Controllers\Controller;

class SiteStatController extends Controller
{
    public function index(): JsonResponse
    {
        $stats = SiteStat::first();

        if (!$stats) {
            $stats = SiteStat::create([
                'total_users' => 0,
                'total_companies' => 0,
                'total_jobs' => 0,
                'total_applications' => 0,
            ]);
        }

        return response()->json([
            'total_users' => $stats->total_users,
            'total_companies' => $stats->total_companies,
            'total_jobs' => $stats->total_jobs,
            'total_applications' => $stats->total_applications,
        ]);
    }
}