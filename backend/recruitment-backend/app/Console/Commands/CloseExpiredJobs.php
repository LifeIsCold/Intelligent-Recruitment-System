<?php

namespace App\Console\Commands;

use App\Models\Job;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CloseExpiredJobs extends Command
{
    protected $signature = 'jobs:close-expired';
    protected $description = 'Close jobs that have passed their closing date.';

    public function handle()
    {
        $count = Job::where('status', 'open')
            ->whereNotNull('closes_at')
            ->where('closes_at', '<=', now())
            ->update(['status' => 'closed']);

        Log::info("Closed {$count} expired jobs.");
        $this->info("Closed {$count} expired jobs.");
    }
}