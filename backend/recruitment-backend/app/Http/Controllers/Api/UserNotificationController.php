<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UserNotificationController extends Controller
{
    /**
     * Get user's notifications
     */
    public function index(Request $request)
    {
        try {
            $notifications = $request->user()
                ->notifications()
                ->with('application.job.company')
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $notifications,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching notifications: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch notifications'
            ], 500);
        }
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, $id)
    {
        try {
            $notification = $request->user()->notifications()->findOrFail($id);
            $notification->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Notification marked as read',
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking notification as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark notification as read'
            ], 500);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllAsRead(Request $request)
    {
        try {
            $request->user()->notifications()->update(['is_read' => true]);

            return response()->json([
                'success' => true,
                'message' => 'All notifications marked as read',
            ]);
        } catch (\Exception $e) {
            Log::error('Error marking all notifications as read: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark all notifications as read'
            ], 500);
        }
    }

    /**
     * Get unread count
     */
    public function unreadCount(Request $request)
    {
        try {
            $count = $request->user()->notifications()->where('is_read', false)->count();

            return response()->json([
                'success' => true,
                'data' => ['unread_count' => $count],
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching unread count: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch unread count'
            ], 500);
        }
    }
}