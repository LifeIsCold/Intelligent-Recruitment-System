<?php
// app/Models/CVScore.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CVScore extends Model
{
    use HasFactory;

    protected $table = 'cv_scores';

    protected $fillable = [
        'cv_id',
        'job_id',
        'application_id',
        'total_score',
        'score_breakdown',
        'matched_skills',
        'missing_skills',
        'bge_analysis',
        'raw_response',
        'scored_at'
    ];

    protected $casts = [
        'total_score' => 'decimal:2',
        'score_breakdown' => 'array',
        'matched_skills' => 'array',
        'missing_skills' => 'array',
        'bge_analysis' => 'array',
        'raw_response' => 'array',
        'scored_at' => 'datetime'
    ];

    public function cv()
    {
        return $this->belongsTo(Cv::class);
    }

    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function application()
    {
        return $this->belongsTo(Application::class);
    }
}