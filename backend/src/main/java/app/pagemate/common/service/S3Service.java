package app.pagemate.common.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.UUID;

@Service
public class S3Service {

    private final S3Client s3Client;
    private final String bucket;
    private final String region;
    private final boolean enabled;

    public S3Service(
            @Value("${aws.access-key:}") String accessKey,
            @Value("${aws.secret-key:}") String secretKey,
            @Value("${aws.s3.region:ap-northeast-2}") String region,
            @Value("${aws.s3.bucket:pagemate-dev}") String bucket
    ) {
        this.bucket = bucket;
        this.region = region;
        if (!accessKey.isBlank() && !secretKey.isBlank()) {
            this.s3Client = S3Client.builder()
                    .region(Region.of(region))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(accessKey, secretKey)))
                    .build();
            this.enabled = true;
        } else {
            this.s3Client = null;
            this.enabled = false;
        }
    }

    public String upload(MultipartFile file, String folder) {
        if (!enabled || file == null || file.isEmpty()) return null;

        String extension = getExtension(file.getOriginalFilename());
        String key = folder + "/" + UUID.randomUUID() + extension;

        try {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(bucket)
                            .key(key)
                            .contentType(file.getContentType())
                            .contentLength(file.getSize())
                            .build(),
                    RequestBody.fromBytes(file.getBytes())
            );
        } catch (IOException e) {
            return null;
        }

        return "https://" + bucket + ".s3." + region + ".amazonaws.com/" + key;
    }

    public void delete(String imageUrl) {
        if (!enabled || imageUrl == null || !imageUrl.contains(bucket)) return;

        String key = imageUrl.substring(imageUrl.indexOf(bucket) + bucket.length() + 1);
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf("."));
    }
}
