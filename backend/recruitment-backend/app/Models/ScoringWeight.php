<?php
// app/Models/ScoringWeight.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScoringWeight extends Model
{
    protected $table = 'scoring_weights';
    
    protected $fillable = [
        'weightable_type',
        'weightable_id',
        'type',
        'required_skills_weight',
        'preferred_skills_weight',
        'experience_weight',
        'education_weight',
        'similarity_threshold',
        'custom_settings',
        'is_active'
    ];

    protected $casts = [
        'required_skills_weight' => 'integer',
        'preferred_skills_weight' => 'integer',
        'experience_weight' => 'integer',
        'education_weight' => 'integer',
        'similarity_threshold' => 'float',
        'custom_settings' => 'array',
        'is_active' => 'boolean'
    ];

    public function weightable()
    {
        return $this->morphTo();
    }

    public static function getDefaultWeights()
    {
        return [
            'required_skills_weight' => 75,
            'preferred_skills_weight' => 0,
            'experience_weight' => 20,
            'education_weight' => 5,
            'similarity_threshold' => 0.6,
            'custom_settings' => []
        ];
    }
}