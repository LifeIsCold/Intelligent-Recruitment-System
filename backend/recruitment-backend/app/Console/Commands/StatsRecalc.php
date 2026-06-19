<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SiteStat;
use App\Models\User;
use App\Models\Company;
use App\Models\Job;
use App\Models\Application;

class StatsRecalc extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stats:recalc';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate site statistics (users, companies, jobs, applications)';

    public function handle()
    {
        $this->info('Recalculating site stats...');

        $users = User::count();
        $companies = Company::count();
        $jobs = Job::count();
        $applications = Application::count();

        $stat = SiteStat::first();
        if (! $stat) {
            $stat = SiteStat::create([
                'total_users' => $users,
                'total_companies' => $companies,
                'total_jobs' => $jobs,
                'total_applications' => $applications,
            ]);
        } else {
            $stat->update([
                'total_users' => $users,
                'total_companies' => $companies,
                'total_jobs' => $jobs,
                'total_applications' => $applications,
            ]);
        }

        $this->info("Done. Users: $users, Companies: $companies, Jobs: $jobs, Applications: $applications");
        return 0;
    }
}
