package com.facturestudio.api.account;

import com.facturestudio.api.user.AppUser;
import com.facturestudio.api.user.UserRepository;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class CurrentUserService {
  private final UserRepository userRepository;

  public CurrentUserService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  public AppUser requireUser(Principal principal) {
    if (principal == null) {
      throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
    }
    return userRepository.findByEmail(principal.getName())
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
  }
}
