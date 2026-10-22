---
title: "Five security checks before an application goes live"
slug: "five-security-checks-before-go-live"
date: "2026-10-21T10:00:00+07:00"
author: "GRINTEC Team"
category: "security"
tags: ["security", "applications", "go-live"]
cover: ""
excerpt: "A short checklist your team can run before a new application opens to users."
draft: false
---

Go-live deadlines often push security checks into "the next phase". The five checks below are light enough to run in a few days and close the gaps attackers use most often.

## 1. Authentication and sessions

Make sure admin accounts use MFA, passwords are stored with strong hashing, and sessions expire after inactivity. Also test whether a regular user can open admin pages by guessing the URL.

## 2. No secrets in the code

API keys, database passwords, and third-party tokens belong in a secret manager or environment variables, not in the repository. Check the commit history too, because a secret that was ever committed can still be found.

## 3. Dependencies scanned

Run a vulnerability scan on the libraries the application uses. Update those with critical issues before release, and record the rest with a plan to fix them.

## 4. Useful logs

Failed logins, permission changes, and server errors should be recorded somewhere the application itself cannot delete. Make sure logs do not contain personal data they do not need.

## 5. Backups that have been restored

A backup that has never been restored has not been proven to work. Do one restore into a separate environment and record how long it takes.

## The regulatory angle

Data protection rules such as the EU's GDPR and Indonesia's Law No. 27 of 2022 on Personal Data Protection require data controllers to keep the data they process secure. These five checks do not replace a full compliance assessment, but they are a good place to start one.
