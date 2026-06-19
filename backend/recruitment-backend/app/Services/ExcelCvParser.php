<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\IOFactory;
use App\Models\Skill;

class ExcelCvParser
{
    /**
     * Parse Excel CV file
     */
    public function parse($file)
    {
        try {
            $spreadsheet = IOFactory::load($file->getPathname());
            $worksheet = $spreadsheet->getActiveSheet();
            
            // Determine if the sheet uses a two-column key-value format
            $highestColumn = $worksheet->getHighestColumn();
            $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);
            $highestRow = $worksheet->getHighestRow();

            // If only two columns, assume key-value pairs
            if ($highestColumnIndex == 2) {
                return $this->parseKeyValueFormat($worksheet);
            } else {
                // Otherwise, fall back to the original table format (single row per CV)
                return $this->parseTableFormat($worksheet);
            }
        } catch (\Exception $e) {
            throw new \Exception('Failed to parse Excel file: ' . $e->getMessage());
        }
    }

    /**
     * Parse two-column key-value format
     */
    private function parseKeyValueFormat($worksheet)
    {
        $rowData = [];
        $highestRow = $worksheet->getHighestRow();

        for ($row = 1; $row <= $highestRow; $row++) {
            $fieldCell = $worksheet->getCell('A' . $row);
            $valueCell = $worksheet->getCell('B' . $row);

            $field = $fieldCell->getValue();
            $value = $valueCell->getValue();

            if (empty($field) || $value === null) {
                continue;
            }

            // Skip template placeholder values
            if ($this->isTemplatePlaceholder($value)) {
                continue;
            }

            $normalizedField = $this->normalizeHeader($field);
            $rowData[$normalizedField] = $value;
        }

        return $this->processRowData($rowData);
    }

    /**
     * Parse table format (original logic, kept for backward compatibility)
     */
    private function parseTableFormat($worksheet)
    {
        $data = [];
        $headers = [];

        foreach ($worksheet->getRowIterator() as $rowIndex => $row) {
            $cellIterator = $row->getCellIterator();
            $cellIterator->setIterateOnlyExistingCells(false);

            $rowData = [];
            foreach ($cellIterator as $columnIndex => $cell) {
                $value = $cell->getValue();

                // First row is headers
                if ($rowIndex === 1) {
                    $headers[$columnIndex] = $this->normalizeHeader($value);
                } else {
                    $header = $headers[$columnIndex] ?? "col_$columnIndex";
                    $rowData[$header] = $value;
                }
            }

            if ($rowIndex > 1 && !empty(array_filter($rowData))) {
                // Process the first row only (single CV per file)
                if (empty($data)) {
                    $data = $this->processRowData($rowData);
                }
                break;
            }
        }

        return $data;
    }

    /**
     * Check if a value is a template placeholder
     */
    private function isTemplatePlaceholder($value)
    {
        if (empty($value) || !is_string($value)) {
            return true;
        }
        
        $value = trim($value);
        
        // Template placeholder patterns
        $patterns = [
            '/^\[.*\]$/',           // [Any Text in Brackets]
            '/^\{.*\}$/',           // {Any Text in Braces}
            '/^<.*>$/',             // <Any Text in Angle Brackets>
            '/^[Nn]\/[Aa]$/',       // N/A, n/a
            '/^[Nn]one$/',          // None, none
            '/^[Nn]ull$/',          // Null, null
            '/^[Tt]BD$/',           // TBD, tbd
        ];
        
        // Check if value matches any placeholder pattern
        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        
        // Check for common template placeholders like "[Your Name]", "[Your Email]"
        if (strpos($value, '[Your ') !== false || strpos($value, '[your ') !== false) {
            return true;
        }
        
        // Check for placeholder patterns like "Your Name", "Your Email" (without brackets)
        $yourPatterns = [
            '/^[Yy]our\s+[Nn]ame$/',
            '/^[Yy]our\s+[Ee]mail$/',
            '/^[Yy]our\s+[Pp]hone$/',
            '/^[Yy]our\s+[Aa]ddress$/',
            '/^[Yy]our\s+[Jj]ob\s+[Tt]itle$/',
            '/^[Yy]our\s+[Ll]inkedIn$/',
            '/^[Yy]our\s+[Gg]itHub$/',
            '/^[Yy]our\s+[Pp]ortfolio$/',
            '/^[Yy]our\s+[Ss]ummary$/',
            '/^[Yy]our\s+[Uu]niversity$/',
            '/^[Yy]our\s+[Ss]kills$/',
            '/^[Yy]our\s+[Ll]anguages$/',
            '/^[Yy]our\s+[Cc]ertifications$/',
            '/^[Yy]our\s+[Dd]esired\s+[Pp]osition$/',
            '/^[Yy]our\s+[Dd]esired\s+[Ii]ndustry$/',
            '/^[Yy]our\s+[Dd]esired\s+[Ll]ocation$/',
            // Education level placeholders
            '/^\[?[Bb]achelor\'?s?\]?$/',     // [Bachelor's] or Bachelor's
            '/^\[?[Mm]aster\'?s?\]?$/',       // [Master's] or Master's
            '/^\[?[Pp]hD\]?$/',                // [PhD] or PhD
            '/^\[?[Hh]igh\s+[Ss]chool\]?$/',  // [High School] or High School
            '/^\[?[Aa]ssociate\'?s?\]?$/',    // [Associate's] or Associate's
        ];
        
        foreach ($yourPatterns as $pattern) {
            if (preg_match($pattern, $value)) {
                return true;
            }
        }
        
        // Special handling for education level with brackets
        if (preg_match('/^\[(.*)\]$/', $value, $matches)) {
            $innerValue = $matches[1];
            $educationPatterns = [
                '/bachelor/i',
                '/master/i',
                '/phd/i',
                '/doctorate/i',
                '/high school/i',
                '/associate/i',
            ];
            foreach ($educationPatterns as $pattern) {
                if (preg_match($pattern, $innerValue)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Normalize header names (improved)
     */
    private function normalizeHeader($header)
    {
        if (empty($header) || !is_string($header)) {
            return '';
        }

        // Trim and remove trailing asterisks
        $header = trim($header);
        $header = rtrim($header, '*');

        // Convert to lowercase and replace spaces/underscores with nothing
        $header = strtolower($header);
        $header = str_replace([' ', '-', '_'], '', $header);

        // Comprehensive mapping of variations to standard field names
        $mapping = [
            'fullname'        => 'full_name',
            'name'            => 'full_name',
            'fullname*'       => 'full_name',
            'email'           => 'email',
            'email*'          => 'email',
            'emailaddress'    => 'email',
            'phone'           => 'phone',
            'phonenumber'     => 'phone',
            'contact'         => 'phone',
            'professionaltitle' => 'professional_title',
            'jobtitle'        => 'professional_title',
            'title'           => 'professional_title',
            'linkedinurl'     => 'linkedin_url',
            'linkedin'        => 'linkedin_url',
            'githuburl'       => 'github_url',
            'github'          => 'github_url',
            'portfoliourl'    => 'portfolio_url',
            'portfolio'       => 'portfolio_url',
            'website'         => 'portfolio_url',
            'professionalsummary' => 'summary',
            'summary'         => 'summary',
            'profile'         => 'summary',
            'about'           => 'summary',
            'yearsofexperience' => 'experience_years',
            'experienceyears' => 'experience_years',
            'experience'      => 'experience_years',
            'highesteducationlevel' => 'education_level',
            'educationlevel'  => 'education_level',
            'education'       => 'education_level',
            'degree'          => 'education_level',
            'institution'     => 'institution',
            'university'      => 'institution',
            'college'         => 'institution',
            'school'          => 'institution',
            'graduationyear'  => 'graduation_year',
            'year'            => 'graduation_year',
            'skills'          => 'skills',
            'skills*'         => 'skills',
            'programmingskills' => 'skills',
            'technicalskills' => 'skills',
            'competencies'    => 'skills',
            'languages'       => 'languages',
            'language'        => 'languages',
            'certifications'  => 'certifications',
            'certificate'     => 'certifications',
            'desiredjobtitle' => 'desired_job_title',
            'desiredindustry' => 'desired_industry',
            'desiredlocation' => 'desired_location',
            'salaryexpectation' => 'salary_expectation',
            'noticeperiod'    => 'notice_period',
        ];

        return $mapping[$header] ?? $header;
    }

    /**
     * Process row data into structured format
     */
    private function processRowData($rowData)
    {
        $processed = [];

        // Map fields to standard format
        $fieldMapping = [
            'full_name'           => ['full_name', 'fullname', 'name'],
            'email'               => ['email', 'emailaddress'],
            'phone'               => ['phone', 'phonenumber', 'contact'],
            'professional_title'  => ['professional_title', 'jobtitle', 'title', 'position'],
            'linkedin_url'        => ['linkedin_url', 'linkedin', 'linkedinprofile'],
            'github_url'          => ['github_url', 'github', 'githubprofile'],
            'portfolio_url'       => ['portfolio_url', 'portfolio', 'website'],
            'summary'             => ['summary', 'profile', 'about', 'professionalsummary'],
            'experience_years'    => ['experience_years', 'yearsofexperience', 'experience'],
            'education_level'     => ['education_level', 'education', 'degree', 'highesteducationlevel'],
            'institution'         => ['institution', 'university', 'college', 'school'],
            'graduation_year'     => ['graduation_year', 'graduationyear', 'year'],
            'skills'              => ['skills', 'programmingskills', 'technicalskills', 'competencies'],
            'languages'           => ['languages', 'language'],
            'certifications'      => ['certifications', 'certificate'],
            'desired_job_title'   => ['desired_job_title', 'desiredjobtitle'],
            'desired_industry'    => ['desired_industry', 'desiredindustry'],
            'desired_location'    => ['desired_location', 'desiredlocation'],
            'salary_expectation'  => ['salary_expectation', 'salaryexpectation'],
            'notice_period'       => ['notice_period', 'noticeperiod'],
        ];

        foreach ($fieldMapping as $standardField => $possibleFields) {
            foreach ($possibleFields as $possibleField) {
                if (isset($rowData[$possibleField]) && !empty($rowData[$possibleField])) {
                    $value = $rowData[$possibleField];
                    
                    // Double-check that it's not a placeholder
                    if (!$this->isTemplatePlaceholder($value)) {
                        $processed[$standardField] = $value;
                    }
                    break;
                }
            }
        }

        // Handle skills - convert string to array
        if (isset($processed['skills']) && is_string($processed['skills'])) {
            $processed['skills'] = $this->parseSkillsString($processed['skills']);
        }

        // Handle experience_years: if value is "None" or similar, set to 0
        if (isset($processed['experience_years']) && is_string($processed['experience_years'])) {
            $exp = strtolower($processed['experience_years']);
            if ($exp === 'none' || $exp === '0' || empty($exp) || $this->isTemplatePlaceholder($exp)) {
                $processed['experience_years'] = 0;
            } else {
                // Try to extract numeric value
                preg_match('/\d+/', $processed['experience_years'], $matches);
                $processed['experience_years'] = $matches[0] ?? 0;
            }
        }

        // Handle education_level: if it's a placeholder, don't include it
        if (isset($processed['education_level'])) {
            $edu = $processed['education_level'];
            if ($this->isTemplatePlaceholder($edu)) {
                unset($processed['education_level']);
            }
        }

        return $processed;
    }

    /**
     * Parse skills string into array
     */
    public function parseSkillsString($skillsString)
    {
        // Split by common delimiters
        $skills = preg_split('/[,;|\/\n]+/', $skillsString);

        // Clean up each skill
        $skills = array_map(function($skill) {
            $skill = trim($skill);
            $skill = preg_replace('/\s*\([^)]*\)/', '', $skill); // Remove parentheses
            return $skill;
        }, $skills);

        // Remove empty values
        $skills = array_filter($skills);

        return array_values($skills);
    }

    /**
     * Extract skills from parsed data
     */
    public function extractSkills($parsedData)
    {
        $skills = [];

        // Get skills from skills field
        if (isset($parsedData['skills']) && is_array($parsedData['skills'])) {
            $skills = array_merge($skills, $parsedData['skills']);
        }

        // Also extract skills from text content
        $textFields = ['summary', 'professional_title'];
        foreach ($textFields as $field) {
            if (isset($parsedData[$field]) && is_string($parsedData[$field])) {
                $textSkills = $this->extractSkillsFromText($parsedData[$field]);
                $skills = array_merge($skills, $textSkills);
            }
        }

        // Match against known skills in database
        $knownSkills = Skill::pluck('name')->toArray();
        $matchedSkills = [];

        foreach ($skills as $skill) {
            foreach ($knownSkills as $knownSkill) {
                if (stripos($skill, $knownSkill) !== false ||
                    stripos($knownSkill, $skill) !== false) {
                    $matchedSkills[] = $knownSkill;
                }
            }
        }

        return array_unique($matchedSkills);
    }

    /**
     * Extract skills from text
     */
    private function extractSkillsFromText($text)
    {
        $knownSkills = Skill::pluck('name')->toArray();
        $foundSkills = [];

        foreach ($knownSkills as $skill) {
            if (stripos($text, $skill) !== false) {
                $foundSkills[] = $skill;
            }
        }

        return $foundSkills;
    }
}