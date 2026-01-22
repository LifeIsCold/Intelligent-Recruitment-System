<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'job_id',
        'cv_id',
        'match_score',
        'status',
    ];

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function cv()
    {
        return $this->belongsTo(Cv::class);
    }
}
