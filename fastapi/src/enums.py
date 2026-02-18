from enum import StrEnum


class ApplicationStatus(StrEnum):
    UNSUBMITTED = "unsubmitted"
    APPLIED = "applied"
    REJECTED = "rejected"
    INTERVIEWING = "interviewing"
    GIVEN_OFFER = "given offer"
    ACCEPTED_OFFER = "accepted offer"
    DECLINED_OFFER = "declined offer"
    NO_OFFER = "no offer"


class CompanyCategory(StrEnum):
    EDUCATION = "education"
    HEALTH = "health"
    CLIMATE = "climate"
    AI = "ai"
    ENERGY = "energy"
    FINANCE = "finance"
    ENTERPRISE_SOFTWARE = "enterprise-software"
    CONSUMER_TECH = "consumer-tech"
    E_COMMERCE = "e-commerce"
    CYBERSECURITY = "cybersecurity"
    GAMING = "gaming"
    MEDIA_ENTERTAINMENT = "media-entertainment"
    CONSULTING = "consulting"
    GOVERNMENT = "government"
    NONPROFIT = "nonprofit"
    RETAIL = "retail"
    RESTAURANT = "restaurant"
    HOSPITALITY = "hospitality"
    OTHER = "other"


class JobSource(StrEnum):
    RECRUITER = "recruiter"
    LINKEDIN = "linkedin"
    INDEED = "indeed"
    FRIEND = "friend"
    COLLEAGUE = "colleague"
    COMPANY_WEBSITE = "company-website"
    OTHER = "other"
