<?php

namespace App\Observers;

use App\Models\Company;
use App\Services\SiteStatService;

class CompanyObserver
{
    public function created(Company $company)
    {
        SiteStatService::increment('total_companies', 1);
    }

    public function deleted(Company $company)
    {
        SiteStatService::decrement('total_companies', 1);
    }

    public function restored(Company $company)
    {
        SiteStatService::increment('total_companies', 1);
    }
}
