package com.smartcampus.backend.config;

import com.smartcampus.backend.model.ResourceStatus;
import com.smartcampus.backend.model.ResourceType;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.convert.converter.Converter;
import org.springframework.data.convert.ReadingConverter;
import org.springframework.data.convert.WritingConverter;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

import java.util.List;

@Configuration
public class ResourceMongoConvertersConfig {

    @Bean
    public MongoCustomConversions mongoCustomConversions() {
        return new MongoCustomConversions(List.of(
                new StringToResourceTypeConverter(),
                new ResourceTypeToStringConverter(),
                new StringToResourceStatusConverter(),
                new ResourceStatusToStringConverter()
        ));
    }

    @ReadingConverter
    static class StringToResourceTypeConverter implements Converter<String, ResourceType> {
        @Override
        public ResourceType convert(String source) {
            return ResourceType.fromValue(source);
        }
    }

    @WritingConverter
    static class ResourceTypeToStringConverter implements Converter<ResourceType, String> {
        @Override
        public String convert(ResourceType source) {
            return source == null ? null : source.name();
        }
    }

    @ReadingConverter
    static class StringToResourceStatusConverter implements Converter<String, ResourceStatus> {
        @Override
        public ResourceStatus convert(String source) {
            return ResourceStatus.fromValue(source);
        }
    }

    @WritingConverter
    static class ResourceStatusToStringConverter implements Converter<ResourceStatus, String> {
        @Override
        public String convert(ResourceStatus source) {
            return source == null ? null : source.name();
        }
    }
}