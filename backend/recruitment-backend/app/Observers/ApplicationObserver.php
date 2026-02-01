<?php

namespace App\Observers;

use App\Models\Application;
use App\Services\SiteStatService;

class ApplicationObserver
{
    public function created(Application $application)
    {
        SiteStatService::increment('total_applications', 1);
    }

    public function deleted(Application $application)
    {
        SiteStatService::decrement('total_applications', 1);
    }

    public function restored(Application $application)
    {
        SiteStatService::increment('total_applications', 1);
    }
}
