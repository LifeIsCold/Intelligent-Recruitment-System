<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CvController;

Route::post('/cvs', [CvController::class, 'store']);

Route::get('/test', function () {
    return response()->json([
        'message' => 'API routes are working'
    ]);
});