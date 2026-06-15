package com.whatsappclone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

// @SpringBootApplication: Yeh Annotation batati hai ki Spring Boot application yahan se start hogi.
// Yeh internal teen annotations ka collection hai: Configuration, EnableAutoConfiguration, aur ComponentScan.
@SpringBootApplication
public class WhatsappCloneBackendApplication {

	public static void main(String[] args) {
		// Java Virtual Machine (JVM) yahan se execution start karegi
		SpringApplication.run(WhatsappCloneBackendApplication.class, args);
	}

}
