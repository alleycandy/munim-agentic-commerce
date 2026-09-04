package com.raosons.munim.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/** The shop runs on Indian Standard Time regardless of where this JVM is deployed. */
@Configuration
public class ShopClockConfig {

    @Bean
    public ZoneId shopZoneId(@Value("${munim.shop-timezone:Asia/Kolkata}") String zone) {
        return ZoneId.of(zone);
    }

    @Bean
    public Clock shopClock(ZoneId shopZoneId) {
        return Clock.system(shopZoneId);
    }
}
