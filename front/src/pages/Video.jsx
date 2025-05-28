import React from 'react';
import { Link } from 'react-router-dom';
import { Button, Container, Row, Col } from 'react-bootstrap';

function Video() {
  return (
    <Container className="text-center mt-5">
      <h2 className="mb-4">Choose Your Video Feature</h2>
      <Row className="justify-content-center">
        <Col xs={12} sm={6} md={4} className="mb-3">
          <Link to="/avatar">
            <Button variant="primary" size="lg" className="w-100">
              🧑‍🎤 Avatar Video Manipulation
            </Button>
          </Link>
        </Col>
        <Col xs={12} sm={6} md={4} className="mb-3">
          <Link to="/real">
            <Button variant="secondary" size="lg" className="w-100">
              🎥 Real Video Processing
            </Button>
          </Link>
        </Col>
      </Row>
    </Container>
  );
}

export default Video;