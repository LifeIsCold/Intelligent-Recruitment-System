<?php

namespace App\Observers;

use App\Models\User;
use App\Services\SiteStatService;

class UserObserver
{
    public function created(User $user)
    {
        SiteStatService::increment('total_users', 1);
    }

    public function deleted(User $user)
    {
        SiteStatService::decrement('total_users', 1);
    }

    public function restored(User $user)
    {
        SiteStatService::increment('total_users', 1);
    }
}
