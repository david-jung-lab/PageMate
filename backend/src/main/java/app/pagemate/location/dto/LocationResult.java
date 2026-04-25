package app.pagemate.location.dto;

public record LocationResult(
        String name,
        String district,
        String city,
        String fullAddress
) {}
