<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // REGISTER
    public function register(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|min:2|max:255',
                'email' => 'required|email|unique:users,email',
                'password' => 'required|min:8|regex:/^(?=.*[A-Z])(?=.*[0-9])/',
                'phone' => 'nullable|string|max:20',
                'role' => 'required|in:recruiter,seeker',
                'company_name' => 'required_if:role,recruiter|nullable|string|min:2|max:255',
                'company_website' => 'nullable|url|max:255',
                'company_contact_person' => 'nullable|string|max:255',
                'company_contact_phone' => 'nullable|string|max:20',
                'industry_id' => 'required_if:role,recruiter|nullable|exists:industries,id',
            ], [
                'name.required' => 'Name is required',
                'name.min' => 'Name must be at least 2 characters',
                'name.string' => 'Name must be text',
                'name.max' => 'Name cannot exceed 255 characters',
                'email.required' => 'Email is required',
                'email.email' => 'Please provide a valid email address',
                'email.unique' => 'This email is already registered',
                'password.required' => 'Password is required',
                'password.min' => 'Password must be at least 8 characters',
                'password.regex' => 'Password must contain at least one uppercase letter and one number',
                'phone.max' => 'Phone number is too long',
                'role.required' => 'User role is required',
                'role.in' => 'Role must be either recruiter or seeker',
                'company_name.required_if' => 'Company name is required for recruiters',
                'company_name.min' => 'Company name must be at least 2 characters',
                'company_name.max' => 'Company name cannot exceed 255 characters',
                'company_website.url' => 'Please provide a valid website URL',
                'company_website.max' => 'Website URL is too long',
                'company_contact_person.max' => 'Contact person name is too long',
                'company_contact_phone.max' => 'Contact phone number is too long',
                'industry_id.exists' => 'Selected industry does not exist'
            ]);

            $companyId = null;

            // If recruiter, create company
            if ($validated['role'] === 'recruiter') {
                if (!$validated['company_name']) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Company name is required for recruiters'
                    ], 422);
                }

                $company = Company::create([
                    'name' => $validated['company_name'],
                    'industry_id' => $validated['industry_id'] ?? 1,
                    'website' => $validated['company_website'] ?? null,
                    'contact_person' => $validated['company_contact_person'] ?? null,
                    'contact_email' => $validated['email'] ?? null,
                    'contact_phone' => $validated['company_contact_phone'] ?? null,
                ]);

                $companyId = $company->id;
            }

            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'role' => $validated['role'],
                'company_id' => $companyId,
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'company_id']),
                'token' => $token
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // LOGIN
    public function login(Request $request)
    {
        try {
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required|string',
                'role' => 'required|in:recruiter,seeker'
            ], [
                'email.required' => 'Email is required',
                'email.email' => 'Please provide a valid email address',
                'password.required' => 'Password is required',
                'role.required' => 'User role is required',
                'role.in' => 'Role must be either recruiter or seeker'
            ]);

            $user = User::where('email', $validated['email'])->first();

            if (!$user || !Hash::check($validated['password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid email or password'
                ], 401);
            }

            // Ensure the user is logging in from the correct portal (role match)
            if ($user->role !== $validated['role']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized for this portal'
                ], 403);
            }

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'user' => $user->only(['id', 'name', 'email', 'role', 'company_id']),
                'token' => $token
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed: ' . $e->getMessage()
            ], 500);
        }
    }

    // LOGOUT
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out'
        ]);
    }

    // UPDATE PROFILE
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $rules = [
            'name' => 'sometimes|required|string|min:2|max:255',
            'email' => 'sometimes|required|email|unique:users,email,'.$user->id,
            'phone' => 'nullable|string|max:20',
        ];

        // If recruiter, allow company updates
        if ($user->role === 'recruiter') {
            $rules = array_merge($rules, [
                'company_name' => 'sometimes|required|string|min:2|max:255',
                'company_website' => 'nullable|url|max:255',
                'company_contact_person' => 'nullable|string|max:255',
                'company_contact_phone' => 'nullable|string|max:20',
                'industry_id' => 'nullable|exists:industries,id'
            ]);
        }

        $validated = $request->validate($rules);

        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['email'])) $user->email = $validated['email'];
        if (array_key_exists('phone', $validated)) $user->phone = $validated['phone'];

        $user->save();

        // Update company for recruiters
        if ($user->role === 'recruiter' && $user->company_id) {
            $company = \App\Models\Company::find($user->company_id);
            if ($company) {
                if (isset($validated['company_name'])) $company->name = $validated['company_name'];
                if (array_key_exists('company_website', $validated)) $company->website = $validated['company_website'];
                if (array_key_exists('company_contact_person', $validated)) $company->contact_person = $validated['company_contact_person'];
                if (array_key_exists('company_contact_phone', $validated)) $company->contact_phone = $validated['company_contact_phone'];
                if (array_key_exists('industry_id', $validated)) $company->industry_id = $validated['industry_id'];
                $company->save();
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Profile updated',
            'user' => $user->only(['id','name','email','phone','role','company_id']),
            'company' => isset($company) ? $company : null
        ]);
    }

    // Get current authenticated user's profile
    public function getProfile(Request $request)
    {
        $user = $request->user();
        $company = null;
        if ($user->company_id) {
            $company = \App\Models\Company::with('industry')->find($user->company_id);
        }

        return response()->json([
            'success' => true,
            'user' => $user->only(['id','name','email','phone','role','company_id']),
            'company' => $company
        ]);
    }
}
