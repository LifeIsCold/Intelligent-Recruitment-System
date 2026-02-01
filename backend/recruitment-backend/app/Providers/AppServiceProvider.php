<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Models\User;
use App\Models\Company;
use App\Models\Job;
use App\Models\Application;
use App\Observers\UserObserver;
use App\Observers\CompanyObserver;
use App\Observers\JobObserver;
use App\Observers\ApplicationObserver;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        User::observe(UserObserver::class);
        Company::observe(CompanyObserver::class);
        Job::observe(JobObserver::class);
        Application::observe(ApplicationObserver::class);
    }
}
