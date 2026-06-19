<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    use HasFactory;

    // Status constants
    const STATUS_PENDING = 'pending';
    const STATUS_REVIEWED = 'reviewed';
    const STATUS_SHORTLISTED = 'shortlisted';
    const STATUS_REJECTED = 'rejected';
    const STATUS_HIRED = 'hired';
    const STATUS_OFFER_EXTENDED = 'offer_extended';
    const STATUS_DECLINED = 'declined';

    protected $fillable = [
        'job_id',
        'cv_id',
        'user_id',
        'match_score',
        'status',
        'applied_at',
        'notes',
        'interview_scheduled_at',
        'interview_location',
        'interview_notes',
        'hired_at',
        'start_date',
        'workplace_address',
    ];

    protected $casts = [
        'applied_at' => 'datetime',
        'hired_at' => 'datetime',
        'start_date' => 'date',
        'interview_scheduled_at' => 'datetime',
        'match_score' => 'integer',
    ];

    // Relationships
    public function job()
    {
        return $this->belongsTo(Job::class);
    }

    public function cv()
    {
        return $this->belongsTo(Cv::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function notifications()
    {
        return $this->hasMany(UserNotification::class);
    }

    // Relationship for CV scores if needed
    public function cvScores()
    {
        return $this->hasMany(CVScore::class);
    }

    // Helper method to check if application can be deleted
    public function canBeDeleted()
    {
        $allowedStatuses = [
            self::STATUS_PENDING,
            self::STATUS_REVIEWED,
        ];
        
        return in_array($this->status, $allowedStatuses);
    }

    // Helper method to get status badge color
    public function getStatusBadgeColor()
    {
        return match($this->status) {
            self::STATUS_PENDING => 'warning',
            self::STATUS_REVIEWED => 'info',
            self::STATUS_SHORTLISTED => 'primary',
            self::STATUS_REJECTED => 'danger',
            self::STATUS_HIRED => 'success',
            self::STATUS_OFFER_EXTENDED => 'success',
            self::STATUS_DECLINED => 'secondary',
            default => 'secondary',
        };
    }

    // Accessor for formatted match score
    public function getFormattedMatchScoreAttribute()
    {
        return $this->match_score ? $this->match_score . '%' : 'N/A';
    }
}