<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFieldsToApplicationsTable extends Migration
{
    public function up()
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dateTime('interview_scheduled_at')->nullable()->after('notes');
            $table->string('interview_location')->nullable()->after('interview_scheduled_at');
            $table->text('interview_notes')->nullable()->after('interview_location');
            $table->timestamp('hired_at')->nullable()->after('interview_notes');
            $table->date('start_date')->nullable()->after('hired_at');
            $table->string('workplace_address')->nullable()->after('start_date');
        });
    }

    public function down()
    {
        Schema::table('applications', function (Blueprint $table) {
            $table->dropColumn([
                'interview_scheduled_at',
                'interview_location',
                'interview_notes',
                'hired_at',
                'start_date',
                'workplace_address',
            ]);
        });
    }
}