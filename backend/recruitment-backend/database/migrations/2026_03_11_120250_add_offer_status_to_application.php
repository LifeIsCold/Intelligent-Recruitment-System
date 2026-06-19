<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class AddOfferStatusToApplications extends Migration
{
    public function up()
    {
        // For MySQL, you can modify the enum like this:
        DB::statement("ALTER TABLE applications MODIFY COLUMN status ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'hired', 'offer_extended', 'declined') DEFAULT 'pending'");
    }

    public function down()
    {
        DB::statement("ALTER TABLE applications MODIFY COLUMN status ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'hired') DEFAULT 'pending'");
    }
}