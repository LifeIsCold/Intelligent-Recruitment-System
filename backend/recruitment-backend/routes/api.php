<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CvController;
use App\Http\Controllers\JobController;
use App\Http\Controllers\MatchController;

Route::post('/match', [MatchController::class, 'match']);
Route::get('/jobs', [JobController::class, 'index']);
Route::post('/jobs', [JobController::class, 'store']);
Route::get('/cvs', [CvController::class, 'index']);
Route::post('/cvs', [CvController::class, 'store']);

Route::get('/test', function () {
    return response()->json([
        'message' => 'API routes are working'
    ]);
});