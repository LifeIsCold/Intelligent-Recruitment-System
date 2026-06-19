<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'name',
        'industry_id',
        'description',
        'website',
        'contact_person',
        'contact_email',
        'contact_phone',
    ];

    public function industry()
    {
        return $this->belongsTo(Industry::class);
    }

    public function jobs()
    {
        return $this->hasMany(Job::class);
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function scoringWeight()
    {
        return $this->morphOne(ScoringWeight::class, 'weightable')
            ->where('type', 'company')
            ->where('is_active', true);
    }

    public function getWeightType()
    {
        return 'company';
    }
}