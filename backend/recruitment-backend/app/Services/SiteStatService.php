<?php

namespace App\Services;

use App\Models\SiteStat;
use Illuminate\Support\Facades\DB;

class SiteStatService
{
    public static function increment(string $field, int $by = 1)
    {
        if (! in_array($field, ['total_users','total_companies','total_jobs','total_applications'])) return;

        DB::transaction(function() use ($field, $by) {
            $stat = SiteStat::first();
            if (! $stat) {
                $stat = SiteStat::create([
                    'total_users' => 0,
                    'total_companies' => 0,
                    'total_jobs' => 0,
                    'total_applications' => 0,
                ]);
            }
            $stat->{$field} = max(0, $stat->{$field} + $by);
            $stat->save();
        });
    }

    public static function decrement(string $field, int $by = 1)
    {
        if (! in_array($field, ['total_users','total_companies','total_jobs','total_applications'])) return;

        DB::transaction(function() use ($field, $by) {
            $stat = SiteStat::first();
            if (! $stat) return;
            $stat->{$field} = max(0, $stat->{$field} - $by);
            $stat->save();
        });
    }
}
