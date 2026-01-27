# Schema Drift Report

## Table: acquired_library_courses
- SQLAlchemy columns (6): id, tenantId, libraryCourseId, localCourseId, hiddenFromCatalog, acquiredAt
- DB columns (6): id, tenantId, libraryCourseId, localCourseId, hiddenFromCatalog, acquiredAt
- DB unique constraints: (none)

## Table: assignment_submissions
- SQLAlchemy columns (16): id, tenantId, assignmentUnitId, assignmentId, userId, courseId, submissionType, content, fileId, status, score, maxScore, comment, submittedAt, gradedAt, gradedBy
- DB columns (15): id, tenantId, assignmentUnitId, userId, courseId, submissionType, content, fileId, submittedAt, gradedAt, gradedBy, score, maxScore, status, comment
- WARNING: Missing in DB: assignmentId
- DB unique constraints: (none)

## Table: assignments
- SQLAlchemy columns (9): id, tenantId, title, description, courseId, dueAt, createdBy, createdAt, updatedAt
- DB columns (9): id, tenantId, title, description, courseId, dueAt, createdBy, createdAt, updatedAt
- DB unique constraints: (none)

## Table: auth_permission
- SQLAlchemy columns (5): id, name, fullPermission, description, createdAt
- DB columns (5): id, name, fullPermission, description, createdAt
- DB unique constraints: (none)

## Table: auth_role
- SQLAlchemy columns (5): id, name, description, createdAt, updatedAt
- DB columns (5): id, name, description, createdAt, updatedAt
- DB unique constraints: (none)

## Table: auth_role_permission
- SQLAlchemy columns (3): roleId, permissionId, createdAt
- DB columns (3): roleId, permissionId, createdAt
- DB unique constraints: (none)

## Table: automation_logs
- SQLAlchemy columns (7): id, tenantId, automationId, userId, status, details, executedAt
- DB columns (7): id, tenantId, automationId, userId, status, details, executedAt
- DB unique constraints: (none)

## Table: automations
- SQLAlchemy columns (8): id, tenantId, name, trigger, actions, enabled, createdAt, updatedAt
- DB columns (9): id, tenantId, name, type, parameters, filters, enabled, createdAt, updatedAt
- WARNING: Missing in DB: trigger, actions
- NOTE: Extra in DB (not mapped): type, parameters, filters
- DB unique constraints: (none)

## Table: badges
- SQLAlchemy columns (7): id, tenantId, name, description, image, criteria, createdAt
- DB columns (7): id, tenantId, name, description, image, criteria, createdAt
- DB unique constraints: (none)

## Table: branches
- SQLAlchemy columns (34): id, tenantId, name, slug, title, description, defaultLanguage, aiEnabled, settings, createdAt, updatedAt, deletedAt, aiFeaturesEnabled, allowedDomains, badgeSet, brandingFaviconUrl, brandingLogoUrl, creditsEnabled, defaultCourseImageUrl, defaultGroupId, defaultUserTypeId, disallowMainDomainLogin, ecommerceProcessor, externalAnnouncement, externalAnnouncementEnabled, internalAnnouncement, internalAnnouncementEnabled, isActive, languageCode, maxRegistrations, signupMode, subscriptionEnabled, termsOfService, timezone
- DB columns (35): id, tenantId, name, slug, title, description, themeId, defaultLanguage, aiEnabled, settings, createdAt, updatedAt, deletedAt, aiFeaturesEnabled, allowedDomains, badgeSet, brandingFaviconUrl, brandingLogoUrl, creditsEnabled, defaultCourseImageUrl, defaultGroupId, defaultUserTypeId, disallowMainDomainLogin, ecommerceProcessor, externalAnnouncement, externalAnnouncementEnabled, internalAnnouncement, internalAnnouncementEnabled, isActive, languageCode, maxRegistrations, signupMode, subscriptionEnabled, termsOfService, timezone
- NOTE: Extra in DB (not mapped): themeId
- DB unique constraints: (none)

## Table: calendar_events
- SQLAlchemy columns (10): id, tenantId, title, description, startTime, endTime, type, instructorId, createdAt, updatedAt
- DB columns (10): id, tenantId, title, description, startTime, endTime, createdAt, instructorId, type, updatedAt
- DB unique constraints: (none)

## Table: categories
- SQLAlchemy columns (7): id, tenantId, parentId, name, description, createdAt, updatedAt
- DB columns (9): id, tenantId, name, parentId, description, price, createdAt, updatedAt, deletedAt
- NOTE: Extra in DB (not mapped): price, deletedAt
- DB unique constraints: (none)

## Table: certificate_issues
- SQLAlchemy columns (6): id, userId, courseId, pathId, templateId, issuedAt
- DB columns (10): id, tenantId, userId, courseId, pathId, templateId, issuedAt, lastIssuedDate, expiresAt, linkedInShared
- NOTE: Extra in DB (not mapped): tenantId, lastIssuedDate, expiresAt, linkedInShared
- DB unique constraints: (none)

## Table: certificate_templates
- SQLAlchemy columns (7): id, name, htmlBody, smartTags, isSystem, createdAt, updatedAt
- DB columns (8): id, tenantId, name, htmlBody, smartTags, isSystem, createdAt, updatedAt
- NOTE: Extra in DB (not mapped): tenantId
- DB unique constraints: (none)

## Table: conference_participants
- SQLAlchemy columns (5): id, tenantId, conferenceId, userId, notified
- DB columns (5): id, tenantId, conferenceId, userId, notified
- DB unique constraints: (none)

## Table: conferences
- SQLAlchemy columns (11): id, tenantId, title, description, startTime, endTime, duration, meetingUrl, instructorId, createdAt, updatedAt
- DB columns (11): id, tenantId, startTime, duration, createdAt, description, endTime, instructorId, meetingUrl, title, updatedAt
- DB unique constraints: (none)

## Table: course_files
- SQLAlchemy columns (8): id, tenantId, courseId, name, url, sizeBytes, mimeType, createdAt
- DB columns (8): id, tenantId, courseId, name, url, sizeBytes, mimeType, createdAt
- DB unique constraints: (none)

## Table: course_instructors
- SQLAlchemy columns (3): tenantId, courseId, userId
- DB columns (3): tenantId, courseId, userId
- DB unique constraints: (none)

## Table: course_rating_settings
- SQLAlchemy columns (3): id, tenantId, enabled
- DB columns (3): id, tenantId, enabled
- DB unique constraints: (none)

## Table: course_ratings
- SQLAlchemy columns (7): id, tenantId, courseId, userId, rating, createdAt, updatedAt
- DB columns (7): id, tenantId, courseId, userId, rating, createdAt, updatedAt
- DB unique constraints: (none)

## Table: course_sections
- SQLAlchemy columns (8): id, tenantId, courseId, title, order_index, dripEnabled, createdAt, updatedAt
- DB columns (10): id, tenantId, courseId, title, dripEnabled, dripType, dripValue, order_index, createdAt, updatedAt
- NOTE: Extra in DB (not mapped): dripType, dripValue
- DB unique constraints: (none)

## Table: course_skills
- SQLAlchemy columns (5): id, tenantId, courseId, skillId, weight
- DB columns (5): id, tenantId, courseId, skillId, weight
- DB unique constraints: (none)

## Table: course_units
- SQLAlchemy columns (11): id, tenantId, courseId, sectionId, type, title, status, order_index, config, createdAt, updatedAt
- DB columns (14): id, tenantId, courseId, type, title, status, isSample, versionHistory, createdAt, updatedAt, linkSourceUnitId, sectionId, config, order_index
- NOTE: Extra in DB (not mapped): isSample, versionHistory, linkSourceUnitId
- DB unique constraints: (none)

## Table: course_versions
- SQLAlchemy columns (6): id, tenantId, courseId, versionNumber, snapshot, createdAt
- DB columns (6): id, tenantId, courseId, versionNumber, snapshot, createdAt
- DB unique constraints: (none)

## Table: courses
- SQLAlchemy columns (16): id, tenantId, code, title, description, status, hiddenFromCatalog, isActive, categoryId, instructorId, thumbnail_url, price, settings, createdAt, updatedAt, deletedAt
- DB columns (38): id, tenantId, code, title, description, status, hiddenFromCatalog, introVideoType, introVideoUrl, capacity, timeLimit, expiration, createdAt, updatedAt, accessRetentionEnabled, categoryId, certificateTemplateId, coachEnabled, completionRule, contentLocked, enrollmentRequestEnabled, isActive, price, publicSharingEnabled, requiredLevel, scoreCalculation, showInCatalog, timeLimitType, unitsOrdering, instructorId, lastPublishedAt, publishedVersionId, version, settings, thumbnail_url, subtitle, enrollmentKey, deletedAt
- NOTE: Extra in DB (not mapped): introVideoType, introVideoUrl, capacity, timeLimit, expiration, accessRetentionEnabled, certificateTemplateId, coachEnabled, completionRule, contentLocked, enrollmentRequestEnabled, publicSharingEnabled, requiredLevel, scoreCalculation, showInCatalog, timeLimitType, unitsOrdering, lastPublishedAt, publishedVersionId, version, subtitle, enrollmentKey
- DB unique constraints: (none)

## Table: discussion_comments
- SQLAlchemy columns (6): id, tenantId, discussionId, body, createdBy, createdAt
- DB columns (6): id, tenantId, discussionId, body, createdBy, createdAt
- DB unique constraints: (none)

## Table: discussion_moderation_settings
- SQLAlchemy columns (5): id, tenantId, editWindowHours, moderatorRole, settings
- DB columns (5): id, tenantId, editWindowHours, moderatorRole, settings
- DB unique constraints: (none)

## Table: discussions
- SQLAlchemy columns (10): id, tenantId, topic, body, audienceType, audienceId, branchId, createdBy, createdAt, updatedAt
- DB columns (10): id, tenantId, topic, body, audienceType, audienceId, branchId, createdBy, createdAt, updatedAt
- DB unique constraints: (none)

## Table: enrollment_extensions
- SQLAlchemy columns (9): id, tenantId, enrollmentId, userId, courseId, newExpirationDate, extendedBy, reason, extendedAt
- DB columns (9): id, tenantId, enrollmentId, userId, courseId, newExpirationDate, extendedBy, reason, extendedAt
- DB unique constraints: (none)

## Table: enrollment_requests
- SQLAlchemy columns (8): id, tenantId, courseId, userId, status, createdAt, resolvedAt, resolvedBy
- DB columns (8): id, tenantId, courseId, userId, status, createdAt, resolvedAt, resolvedBy
- DB unique constraints: (none)

## Table: enrollments
- SQLAlchemy columns (13): id, tenantId, userId, courseId, status, progress, score, completedAt, expiresAt, certificateId, createdAt, updatedAt, deletedAt
- DB columns (15): id, tenantId, userId, courseId, status, progress, score, startedAt, completedAt, expiresAt, certificateId, lastAccessedAt, createdAt, updatedAt, deletedAt
- NOTE: Extra in DB (not mapped): startedAt, lastAccessedAt
- DB unique constraints: (none)

## Table: file_visibility
- SQLAlchemy columns (5): id, tenantId, fileId, userId, canView
- DB columns (5): id, tenantId, fileId, userId, canView
- DB unique constraints: (none)

## Table: files
- SQLAlchemy columns (13): id, tenantId, filename, filepath, externalUrl, filesize, mimeType, ownerType, ownerId, uploadedBy, isShared, canShare, uploadedAt
- DB columns (13): id, tenantId, filename, filepath, externalUrl, filesize, mimeType, ownerType, ownerId, uploadedBy, isShared, canShare, uploadedAt
- DB unique constraints: (none)

## Table: free_text_keywords
- SQLAlchemy columns (6): id, tenantId, questionId, keyword, pointsModifier, isRequired
- DB columns (6): id, tenantId, questionId, keyword, pointsModifier, isRequired
- DB unique constraints: (none)

## Table: gamification_settings
- SQLAlchemy columns (11): id, tenantId, branchId, enabled, pointsEnabled, badgesEnabled, levelsEnabled, rewardsEnabled, leaderboardEnabled, pointsPerLogin, maxLevel
- DB columns (11): id, tenantId, branchId, enabled, pointsEnabled, badgesEnabled, levelsEnabled, rewardsEnabled, leaderboardEnabled, pointsPerLogin, maxLevel
- DB unique constraints: (none)

## Table: group_courses
- SQLAlchemy columns (5): id, tenantId, groupId, courseId, addedAt
- DB columns (5): id, tenantId, groupId, courseId, addedAt
- DB unique constraints: (none)

## Table: group_members
- SQLAlchemy columns (5): id, tenantId, groupId, userId, addedAt
- DB columns (5): id, tenantId, groupId, userId, addedAt
- DB unique constraints: (none)

## Table: groups
- SQLAlchemy columns (13): id, tenantId, name, description, branchId, instructorId, createdAt, updatedAt, deletedAt, autoEnroll, maxMembers, price, groupKey
- DB columns (13): id, tenantId, name, description, maxMembers, branchId, createdAt, updatedAt, deletedAt, autoEnroll, groupKey, price, instructorId
- DB unique constraints: (none)

## Table: ilt_attendance
- SQLAlchemy columns (10): id, tenantId, sessionId, userId, attended, score, status, gradedAt, gradedBy, comment
- DB columns (10): id, tenantId, sessionId, userId, attended, score, status, gradedAt, gradedBy, comment
- DB unique constraints: (none)

## Table: ilt_sessions
- SQLAlchemy columns (8): id, tenantId, iltUnitId, courseId, sessionDate, duration, provider, providerData
- DB columns (8): id, tenantId, iltUnitId, courseId, sessionDate, duration, provider, providerData
- DB unique constraints: (none)

## Table: job_roles
- SQLAlchemy columns (6): id, tenantId, name, description, createdAt, updatedAt
- DB columns (6): id, tenantId, name, description, createdAt, updatedAt
- DB unique constraints: (none)

## Table: learner_course_state
- SQLAlchemy columns (7): id, tenantId, userId, courseId, lastUnitId, lastAccessedAt, updatedAt
- DB columns (7): id, tenantId, userId, courseId, lastUnitId, lastAccessedAt, updatedAt
- DB unique constraints: (none)

## Table: learning_path_courses
- SQLAlchemy columns (10): id, tenantId, pathId, courseId, order, createdAt, minScore, unlockCourseId, unlockType, sectionId
- DB columns (10): id, tenantId, pathId, courseId, order, createdAt, minScore, unlockCourseId, unlockType, sectionId
- DB unique constraints: (none)

## Table: learning_path_enrollments
- SQLAlchemy columns (10): id, tenantId, userId, pathId, status, progress, enrolledAt, completedAt, createdAt, updatedAt
- DB columns (12): id, tenantId, userId, pathId, role, status, progress, enrolledAt, completedAt, expiresAt, createdAt, updatedAt
- NOTE: Extra in DB (not mapped): role, expiresAt
- DB unique constraints: (none)

## Table: learning_path_sections
- SQLAlchemy columns (7): id, tenantId, pathId, name, order, createdAt, updatedAt
- DB columns (7): id, tenantId, pathId, name, order, createdAt, updatedAt
- DB unique constraints: (none)

## Table: learning_path_skills
- SQLAlchemy columns (5): id, tenantId, learningPathId, skillId, weight
- DB columns (5): id, tenantId, learningPathId, skillId, weight
- DB unique constraints: (none)

## Table: learning_paths
- SQLAlchemy columns (12): id, tenantId, name, code, description, status, isActive, isSequential, branchId, instructorId, createdAt, updatedAt
- DB columns (24): id, tenantId, name, code, description, image, isActive, limitDays, accessRetention, isSequential, certificateId, maxCourses, branchId, createdAt, updatedAt, deletedAt, category, status, accessRetentionEnabled, certificateType, completionDaysLimit, courseOrderMode, completionRule, instructorId
- NOTE: Extra in DB (not mapped): image, limitDays, accessRetention, certificateId, maxCourses, deletedAt, category, accessRetentionEnabled, certificateType, completionDaysLimit, courseOrderMode, completionRule
- DB unique constraints: (none)

## Table: levels
- SQLAlchemy columns (6): id, tenantId, levelNumber, pointsRequired, name, badge
- DB columns (6): id, tenantId, levelNumber, pointsRequired, name, badge
- DB unique constraints: (none)

## Table: lrs_statements
- SQLAlchemy columns (10): id, actor, verb, object, result, context, timestamp, stored, authority, version
- DB columns (10): id, actor, verb, object, result, context, timestamp, stored, authority, version
- DB unique constraints: (none)

## Table: message_recipients
- SQLAlchemy columns (6): id, tenantId, threadId, userId, isRead, readAt
- DB columns (6): id, tenantId, threadId, userId, isRead, readAt
- DB unique constraints: (none)

## Table: message_threads
- SQLAlchemy columns (6): id, tenantId, subject, createdBy, createdAt, updatedAt
- DB columns (6): id, tenantId, subject, createdBy, createdAt, updatedAt
- DB unique constraints: (none)

## Table: messages
- SQLAlchemy columns (7): id, tenantId, threadId, senderId, body, attachments, sentAt
- DB columns (7): id, tenantId, threadId, senderId, body, attachments, sentAt
- DB unique constraints: (none)

## Table: messaging_permissions
- SQLAlchemy columns (6): id, tenantId, userTypeId, canMessageAdmins, canMessageUsers, canMessageInstructors
- DB columns (6): id, tenantId, userTypeId, canMessageAdmins, canMessageUsers, canMessageInstructors
- DB unique constraints: (none)

## Table: notification_history
- SQLAlchemy columns (10): id, tenantId, notificationId, recipientEmail, recipientUserId, eventKey, contextJson, sentAt, status, errorMessage
- DB columns (10): id, tenantId, notificationId, recipientEmail, recipientUserId, eventKey, contextJson, sentAt, status, errorMessage
- DB unique constraints: (none)

## Table: notifications
- SQLAlchemy columns (16): id, tenantId, name, eventKey, messageSubject, messageBody, recipientType, recipientUserId, filterBranches, filterCourses, filterGroups, hoursOffset, offsetDirection, isActive, createdAt, updatedAt
- DB columns (16): id, tenantId, name, createdAt, updatedAt, eventKey, filterBranches, filterCourses, filterGroups, hoursOffset, isActive, messageBody, messageSubject, offsetDirection, recipientType, recipientUserId
- DB unique constraints: (none)

## Table: password_reset_tokens
- SQLAlchemy columns (7): id, tenantId, userId, token, expiresAt, usedAt, createdAt
- DB columns (9): id, tenantId, userId, token, expiresAt, usedAt, ipAddress, userAgent, createdAt
- NOTE: Extra in DB (not mapped): ipAddress, userAgent
- DB unique constraints: (none)

## Table: points_ledger
- SQLAlchemy columns (6): id, tenantId, userId, points, reason, createdAt
- DB columns (6): id, tenantId, userId, points, reason, createdAt
- DB unique constraints: (none)

## Table: portal_feature_flags
- SQLAlchemy columns (8): id, tenantId, createdAt, planTier, prerequisitesEnabled, learningPathsEnabled, learningPathsLimit, messagingEnabled
- DB columns (8): id, tenantId, createdAt, planTier, prerequisitesEnabled, learningPathsEnabled, learningPathsLimit, messagingEnabled
- DB unique constraints: (none)

## Table: prerequisites
- SQLAlchemy columns (6): id, tenantId, courseId, pathIndex, requiredCourseId, requiredLevel
- DB columns (6): id, tenantId, courseId, pathIndex, requiredCourseId, requiredLevel
- DB unique constraints: (none)

## Table: question_pools
- SQLAlchemy columns (6): id, tenantId, name, courseId, minQuestions, createdAt
- DB columns (6): id, tenantId, name, courseId, minQuestions, createdAt
- DB unique constraints: (none)

## Table: questions
- SQLAlchemy columns (14): id, tenantId, testId, questionPoolId, type, text, options, correctAnswer, points, feedback, tags, aiGenerated, order, createdAt
- DB columns (14): id, tenantId, testId, questionPoolId, type, text, options, correctAnswer, points, feedback, tags, aiGenerated, order, createdAt
- DB unique constraints: (none)

## Table: reports
- SQLAlchemy columns (7): id, name, type, ruleset, createdBy, createdAt, updatedAt
- DB columns (8): id, tenantId, name, type, ruleset, createdBy, createdAt, updatedAt
- NOTE: Extra in DB (not mapped): tenantId
- DB unique constraints: (none)

## Table: rewards
- SQLAlchemy columns (7): id, tenantId, name, type, discountPercent, criteria, active
- DB columns (7): id, tenantId, name, type, discountPercent, criteria, active
- DB unique constraints: (none)

## Table: role_skills
- SQLAlchemy columns (6): id, tenantId, roleId, skillId, requiredLevel, weight
- DB columns (6): id, tenantId, roleId, skillId, requiredLevel, weight
- DB unique constraints: (none)

## Table: scorm_data
- SQLAlchemy columns (13): id, tenantId, userId, unitId, lessonStatus, lessonLocation, suspendData, scoreRaw, scoreMax, scoreMin, sessionTime, totalTime, updatedAt
- DB columns (13): id, tenantId, userId, unitId, lessonStatus, lessonLocation, suspendData, scoreRaw, scoreMax, scoreMin, sessionTime, totalTime, updatedAt
- DB unique constraints: (none)

## Table: skill_questions
- SQLAlchemy columns (8): id, tenantId, skillId, question, options, correctAnswer, aiGenerated, order
- DB columns (8): id, tenantId, skillId, question, options, correctAnswer, aiGenerated, order
- DB unique constraints: (none)

## Table: skill_recommendations
- SQLAlchemy columns (7): id, tenantId, fromUserId, toUserId, skillId, note, createdAt
- DB columns (7): id, tenantId, fromUserId, toUserId, skillId, note, createdAt
- DB unique constraints: (none)

## Table: skill_resources
- SQLAlchemy columns (6): id, tenantId, skillId, title, url, order
- DB columns (6): id, tenantId, skillId, title, url, order
- DB unique constraints: (none)

## Table: skills
- SQLAlchemy columns (7): id, tenantId, name, description, imageUrl, createdAt, updatedAt
- DB columns (10): id, tenantId, name, description, aiInstructions, numQuestionsRequired, timerDuration, createdAt, updatedAt, imageUrl
- NOTE: Extra in DB (not mapped): aiInstructions, numQuestionsRequired, timerDuration
- DB unique constraints: (none)

## Table: talent_library_courses
- SQLAlchemy columns (8): id, externalId, title, description, previewTrailer, categories, isPromoted, license
- DB columns (8): id, externalId, title, description, previewTrailer, categories, isPromoted, license
- DB unique constraints: (none)

## Table: tenants
- SQLAlchemy columns (7): id, domain, name, settings, createdAt, updatedAt, deletedAt
- DB columns (7): id, domain, name, settings, createdAt, updatedAt, deletedAt
- DB unique constraints: (none)

## Table: test_attempts
- SQLAlchemy columns (11): id, tenantId, testId, userId, courseId, startedAt, completedAt, score, maxScore, passed, answers
- DB columns (11): id, tenantId, testId, userId, courseId, startedAt, completedAt, score, maxScore, passed, answers
- DB unique constraints: (none)

## Table: tests
- SQLAlchemy columns (9): id, tenantId, unitId, isRandomized, questionsToShow, passingScore, settings, createdAt, updatedAt
- DB columns (9): id, tenantId, unitId, isRandomized, questionsToShow, passingScore, settings, createdAt, updatedAt
- DB unique constraints: (none)

## Table: timeline_events
- SQLAlchemy columns (7): id, tenantId, userId, courseId, eventType, data, createdAt
- DB columns (9): id, tenantId, userId, courseId, branchId, eventType, details, timestamp, partition_key
- WARNING: Missing in DB: data, createdAt
- NOTE: Extra in DB (not mapped): branchId, details, timestamp, partition_key
- DB unique constraints: (none)

## Table: unit_assets
- SQLAlchemy columns (11): id, tenantId, courseId, unitId, kind, url, storageKey, name, sizeBytes, mimeType, createdAt
- DB columns (11): id, tenantId, courseId, unitId, kind, url, storageKey, name, sizeBytes, mimeType, createdAt
- DB unique constraints: (none)

## Table: user_roles
- SQLAlchemy columns (5): id, tenantId, userId, roleKey, createdAt
- DB columns (5): id, tenantId, userId, roleKey, createdAt
- DB unique constraints: (none)

## Table: user_skills
- SQLAlchemy columns (8): id, tenantId, userId, skillId, level, progress, evidence, updatedAt
- DB columns (8): id, tenantId, userId, skillId, level, progress, evidence, updatedAt
- DB unique constraints: (none)

## Table: user_types
- SQLAlchemy columns (4): id, name, permissions, createdAt
- DB columns (4): id, name, permissions, createdAt
- DB unique constraints: (none)

## Table: users
- SQLAlchemy columns (29): id, tenantId, username, email, firstName, lastName, bio, timezone, language, userTypeId, passwordHash, avatar, status, deactivateAt, activeRole, role, is_active, is_verified, lastLoginAt, failedLoginAttempts, lockedUntil, excludeFromEmails, certificatesArchive, rbac_overrides, node_id, token_version, createdAt, updatedAt, deletedAt
- DB columns (29): id, tenantId, username, email, firstName, lastName, bio, timezone, language, userTypeId, passwordHash, avatar, status, deactivateAt, activeRole, role, is_active, is_verified, lastLoginAt, failedLoginAttempts, lockedUntil, excludeFromEmails, certificatesArchive, rbac_overrides, node_id, token_version, createdAt, updatedAt, deletedAt
- DB unique constraints: (none)
