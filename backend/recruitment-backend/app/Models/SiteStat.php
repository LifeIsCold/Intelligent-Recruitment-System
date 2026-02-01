<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SiteStat extends Model
{
    protected $table = 'site_stats';

    protected $fillable = [
        'total_users',
        'total_companies',
        'total_jobs',
        'total_applications'
    ];
}
