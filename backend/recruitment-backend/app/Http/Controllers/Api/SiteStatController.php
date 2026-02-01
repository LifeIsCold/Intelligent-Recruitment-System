<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SiteStat;

class SiteStatController extends Controller
{
    // Public: return the single stats row (or zeros)
    public function index()
    {
        $stat = SiteStat::first();
        if (! $stat) {
            return response()->json([
                'total_users' => 0,
                'total_companies' => 0,
                'total_jobs' => 0,
                'total_applications' => 0,
            ]);
        }

        return response()->json($stat);
    }

    // Protected: update counters (partial)
    public function update(Request $request)
    {
        $this->validate($request, [
            'total_users' => 'sometimes|integer|min:0',
            'total_companies' => 'sometimes|integer|min:0',
            'total_jobs' => 'sometimes|integer|min:0',
            'total_applications' => 'sometimes|integer|min:0',
        ]);

        $stat = SiteStat::first();
        if (! $stat) {
            $stat = SiteStat::create([
                'total_users' => 0,
                'total_companies' => 0,
                'total_jobs' => 0,
                'total_applications' => 0,
            ]);
        }

        $stat->fill($request->only(['total_users','total_companies','total_jobs','total_applications']));
        $stat->save();

        return response()->json(['success' => true, 'stat' => $stat]);
    }
}
