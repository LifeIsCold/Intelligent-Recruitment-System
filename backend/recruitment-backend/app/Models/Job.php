<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Job extends Model
{
    protected $fillable = [
        'title',
        'description',
        'company_id',
        'industry_id',
        'created_by',
        'status',
        'work_type',
        'work_time',
        'salary',
        'required_skills',
        'benefits',
        'location',
        'closes_at',                
    ];

    protected $casts = [
        'required_skills' => 'array',
        'closes_at' => 'datetime',   
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function industry()
    {
        return $this->belongsTo(Industry::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function applications()
    {
        return $this->hasMany(Application::class);
    }

    public function cvScores()
    {
        return $this->hasMany(CVScore::class);
    }

    public function getAverageScore()
    {
        return $this->cvScores()->avg('total_score');
    }

    public function savedByUsers()
    {
        return $this->belongsToMany(User::class, 'saved_jobs')
                    ->withTimestamps();
    }

    public function scoringWeight()
    {
        return $this->morphOne(ScoringWeight::class, 'weightable')
            ->where('type', 'job')
            ->where('is_active', true);
    }

    public function getWeightType()
    {
        return 'job';
    }

    public function getScoringWeights()
    {
        // Check job-specific weights first
        if ($this->scoringWeight) {
            return [
                'required_skills_weight' => $this->scoringWeight->required_skills_weight,
                'preferred_skills_weight' => $this->scoringWeight->preferred_skills_weight,
                'experience_weight' => $this->scoringWeight->experience_weight,
                'education_weight' => $this->scoringWeight->education_weight,
                'similarity_threshold' => $this->scoringWeight->similarity_threshold
            ];
        }
        
        // Then check company weights
        if ($this->company && $this->company->scoringWeight) {
            return [
                'required_skills_weight' => $this->company->scoringWeight->required_skills_weight,
                'preferred_skills_weight' => $this->company->scoringWeight->preferred_skills_weight,
                'experience_weight' => $this->company->scoringWeight->experience_weight,
                'education_weight' => $this->company->scoringWeight->education_weight,
                'similarity_threshold' => $this->company->scoringWeight->similarity_threshold
            ];
        }
        
        // Finally, return global defaults
        return ScoringWeight::getDefaultWeights();
    }

    // Accessor to include weights in API responses
    public function getScoringWeightsAttribute()
    {
        return $this->getScoringWeights();
    }
}