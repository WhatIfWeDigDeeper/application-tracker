class ApplicationController < ActionController::API
  rescue_from ActiveRecord::RecordInvalid, with: :render_record_invalid
  rescue_from ActiveRecord::RecordNotFound, with: :render_not_found
  rescue_from ApiParams::InvalidDate, with: :render_invalid_date

  private

  def json_payload
    request.request_parameters
  end

  def render_record_invalid(error)
    render json: validation_error(error.record.errors), status: :bad_request
  end

  def render_invalid_date(error)
    render json: {
      code: "validation_error",
      message: error.message,
      details: []
    }, status: :bad_request
  end

  def render_not_found
    render json: { code: "not_found", message: "Resource not found" }, status: :not_found
  end

  def validation_error(errors)
    {
      code: "validation_error",
      message: "Validation failed",
      details: errors.map do |error|
        {
          field: error.attribute.to_s.camelize(:lower),
          message: error.message
        }
      end
    }
  end
end
