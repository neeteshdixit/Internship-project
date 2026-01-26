# Realtime Chat App (Spring Boot + WebSocket + WebRTC)

## Overview
This is a demo real-time chat application built with:
- Backend: Spring Boot (WebSocket STOMP)
- Frontend: Static HTML/JS (SockJS + STOMP + WebRTC)
- Database: MySQL (chat persistence)

Audio/video calling uses WebRTC with the Spring Boot app acting as the signalling server.

## Setup (quick)
1. Start MySQL and create DB:
   ```sql
   CREATE DATABASE chatdb;
