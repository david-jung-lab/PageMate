package app.pagemate.location;

import app.pagemate.common.response.ApiResponse;
import app.pagemate.location.dto.LocationResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/locations")
@RequiredArgsConstructor
public class LocationController {

    private final LocationService locationService;

    @GetMapping("/search")
    public ApiResponse<List<LocationResult>> search(@RequestParam String query) {
        return ApiResponse.ok(locationService.search(query));
    }

    @GetMapping("/reverse-geocode")
    public ApiResponse<LocationResult> reverseGeocode(
            @RequestParam double lat,
            @RequestParam double lng
    ) {
        return ApiResponse.ok(locationService.reverseGeocode(lat, lng));
    }
}
