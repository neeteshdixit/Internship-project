package com.whatsappclone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WhatsappCloneBackendApplication {

	public static void main(String[] args) {
		// Java Virtual Machine (JVM) yahan se execution start karegi
		SpringApplication.run(WhatsappCloneBackendApplication.class, args);
	}

}
