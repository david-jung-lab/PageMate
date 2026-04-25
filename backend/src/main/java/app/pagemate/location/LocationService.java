package app.pagemate.location;

import app.pagemate.location.dto.LocationResult;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LocationService {

    private final RestTemplate restTemplate;

    @Value("${kakao.api-key}")
    private String apiKey;

    @Value("${kakao.local-search-url}")
    private String localSearchUrl;

    @Value("${kakao.reverse-geocode-url}")
    private String reverseGeocodeUrl;

    @SuppressWarnings("unchecked")
    public List<LocationResult> search(String query) {
        String url = localSearchUrl + "?query=" + encodeQuery(query) + "&size=10";
        ResponseEntity<Map> response = exchange(url);

        if (response.getBody() == null) return Collections.emptyList();

        List<Map<String, Object>> documents = (List<Map<String, Object>>) response.getBody().get("documents");
        if (documents == null) return Collections.emptyList();

        return documents.stream()
                .map(doc -> {
                    Map<String, Object> addr = (Map<String, Object>) doc.get("address");
                    if (addr == null) return null;
                    String city = str(addr, "region_1depth_name");
                    String district = str(addr, "region_2depth_name");
                    String name = str(addr, "region_3depth_name");
                    String full = str(addr, "address_name");
                    if (name.isBlank()) return null;
                    return new LocationResult(name, district, city, full);
                })
                .filter(r -> r != null && !r.name().isBlank())
                .distinct()
                .limit(10)
                .collect(Collectors.toList());
    }

    @SuppressWarnings("unchecked")
    public LocationResult reverseGeocode(double lat, double lng) {
        String url = reverseGeocodeUrl + "?x=" + lng + "&y=" + lat;
        ResponseEntity<Map> response = exchange(url);

        if (response.getBody() == null) return null;

        List<Map<String, Object>> documents = (List<Map<String, Object>>) response.getBody().get("documents");
        if (documents == null || documents.isEmpty()) return null;

        Map<String, Object> addr = (Map<String, Object>) documents.get(0).get("address");
        if (addr == null) return null;

        String city = str(addr, "region_1depth_name");
        String district = str(addr, "region_2depth_name");
        String name = str(addr, "region_3depth_name");
        String full = str(addr, "address_name");

        return new LocationResult(name, district, city, full);
    }

    private ResponseEntity<Map> exchange(String url) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "KakaoAK " + apiKey);
        HttpEntity<Void> entity = new HttpEntity<>(headers);
        return restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
    }

    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v == null ? "" : v.toString();
    }

    private String encodeQuery(String q) {
        try {
            return java.net.URLEncoder.encode(q, "UTF-8");
        } catch (Exception e) {
            return q;
        }
    }
}
