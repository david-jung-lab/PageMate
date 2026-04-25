package app.pagemate.user.dto;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Getter
@Setter
public class ProfileUpdateRequest {
    private String nickname;
    private String handle;
    private String bio;
    private String location;
    private String avatarColor;
    private List<String> tags;
    private MultipartFile image;
}
