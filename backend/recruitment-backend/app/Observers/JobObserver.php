<?php

namespace App\Observers;

use App\Models\Job;
use App\Services\SiteStatService;

class JobObserver
{
    public function created(Job $job)
    {
        SiteStatService::increment('total_jobs', 1);
    }

    public function deleted(Job $job)
    {
        SiteStatService::decrement('total_jobs', 1);
    }

    public function restored(Job $job)
    {
        SiteStatService::increment('total_jobs', 1);
    }
}
