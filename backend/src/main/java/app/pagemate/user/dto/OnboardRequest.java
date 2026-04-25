package app.pagemate.user.dto;

import java.util.List;

public record OnboardRequest(
        String nickname,
        String handle,
        String bio,
        String location,
        List<String> genres
) {}
